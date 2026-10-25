import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { offers } from "@/content/offers";
import { getActiveCampaign, getCountdown } from "@/lib/campaign";
import type { Campaign } from "@/lib/types";

const campaign: Campaign = {
  active: true,
  name: "Test week",
  message: "Test week: 15% off with code TEST15",
  startsAt: "2026-10-25T00:00:00+02:00",
  endsAt: "2026-11-01T23:59:59+01:00",
  code: "TEST15",
};

// 2026-11-01T23:59:59+01:00
const END = new Date("2026-11-01T22:59:59Z");

describe("getActiveCampaign", () => {
  it("is active between startsAt and endsAt", () => {
    expect(getActiveCampaign(new Date("2026-10-30T12:00:00Z"), campaign)).toBe(campaign);
    expect(getActiveCampaign(new Date(END.getTime() - 1), campaign)).toBe(campaign);
    expect(getActiveCampaign(new Date("2026-10-24T22:00:00Z"), campaign)).toBe(campaign);
  });

  it("is gone exactly at endsAt and after", () => {
    expect(getActiveCampaign(END, campaign)).toBeNull();
    expect(getActiveCampaign(new Date("2026-11-02T08:00:00Z"), campaign)).toBeNull();
    expect(getActiveCampaign(new Date("2027-01-01T00:00:00Z"), campaign)).toBeNull();
  });

  it("is null before startsAt", () => {
    expect(getActiveCampaign(new Date("2026-10-24T21:59:59Z"), campaign)).toBeNull();
  });

  it("is null when active is false", () => {
    expect(getActiveCampaign(new Date("2026-10-30T12:00:00Z"), { ...campaign, active: false })).toBeNull();
  });

  it("works without startsAt and fails closed on a broken endsAt", () => {
    const { startsAt: _unused, ...withoutStart } = campaign;
    void _unused;
    expect(getActiveCampaign(new Date("2020-01-01T00:00:00Z"), withoutStart)).toEqual(withoutStart);
    expect(getActiveCampaign(new Date("2026-10-30T12:00:00Z"), { ...campaign, endsAt: "soon" })).toBeNull();
  });

  it("defaults to the campaign in content/offers.ts", () => {
    expect(getActiveCampaign(new Date("2026-10-30T12:00:00Z"))).toBe(offers.campaign);
    expect(getActiveCampaign(new Date("2026-11-01T22:59:59Z"))).toBeNull();
  });
});

describe("getCountdown", () => {
  it("splits the remaining time", () => {
    const now = new Date(END.getTime() - ((2 * 24 + 3) * 3_600_000 + 4 * 60_000 + 5_000 + 250));
    expect(getCountdown(now, campaign.endsAt)).toEqual({
      totalMs: (2 * 24 + 3) * 3_600_000 + 4 * 60_000 + 5_000 + 250,
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
  });

  it("counts the full launch week from the start", () => {
    const start = new Date("2026-10-25T00:00:00+02:00");
    // 7 days 23:59:59 on the wall clock, plus the hour gained when DST ends on 25 October.
    expect(getCountdown(start, campaign.endsAt)).toMatchObject({ days: 8, hours: 0, minutes: 59, seconds: 59 });
  });

  it("accepts a Date and clamps at 0", () => {
    expect(getCountdown(new Date(END.getTime() - 1_000), END)).toEqual({
      totalMs: 1_000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
    });
    const zero = { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    expect(getCountdown(END, END)).toEqual(zero);
    expect(getCountdown(new Date("2027-01-01T00:00:00Z"), campaign.endsAt)).toEqual(zero);
    expect(getCountdown(END, "not a date")).toEqual(zero);
  });
});

describe("content/offers.ts campaign (brief §2.3)", () => {
  const isoWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?[+-]\d{2}:\d{2}$/;

  it("ends at a fixed ISO timestamp with an explicit offset", () => {
    expect(offers.campaign.endsAt).toMatch(isoWithOffset);
    expect(Number.isNaN(Date.parse(offers.campaign.endsAt))).toBe(false);
    if (offers.campaign.startsAt !== undefined) {
      expect(offers.campaign.startsAt).toMatch(isoWithOffset);
      expect(Date.parse(offers.campaign.startsAt)).toBeLessThan(Date.parse(offers.campaign.endsAt));
    }
  });

  it("writes endsAt as a literal in the source, never computed from the clock", () => {
    const source = readFileSync(fileURLToPath(new URL("../content/offers.ts", import.meta.url)), "utf8");
    expect(source).toContain(`endsAt: "${offers.campaign.endsAt}"`);
    expect(source).not.toMatch(/Date\.now\(|new Date\(/);
  });

  it("uses a code that exists in discountCodes and ends with the campaign", () => {
    const code = offers.campaign.code;
    if (code === undefined) return;
    const discount = offers.discountCodes.find((candidate) => candidate.code === code);
    expect(discount).toBeDefined();
    expect(discount?.source).toBe("campaign");
    if (discount?.endsAt !== undefined) {
      expect(Date.parse(discount.endsAt)).toBeLessThanOrEqual(Date.parse(offers.campaign.endsAt));
    }
  });
});
