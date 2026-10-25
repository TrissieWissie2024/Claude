import { describe, expect, it } from "vitest";
import { normalizeDiscountCode } from "@/lib/pricing";
import { offers } from "./offers";

/*
 * content/offers.ts against brief §4 and D07 to D12. Pricing behaviour is
 * tested in lib/pricing.test.ts; this file pins the configured values and the
 * invariants the pricing logic relies on.
 */

function isCents(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

describe("prices (brief §4, D07)", () => {
  it("prices 1, 2 and 3 sticks at €24.95, €44.95 and €59.95", () => {
    expect(offers.currency).toBe("EUR");
    expect(offers.stickPricing).toEqual({ 1: 2495, 2: 4495, 3: 5995 });
  });

  it("prices the Discovery Set, the Travel Pouch and the gift cards", () => {
    expect(offers.prices).toEqual({ discoverySet: 2995, travelPouch: 995 });
    expect(offers.giftCardDenominations).toEqual([2500, 5000, 10000]);
  });

  it("stores every amount as whole cents", () => {
    const amounts = [
      ...Object.values(offers.stickPricing),
      offers.prices.discoverySet,
      offers.prices.travelPouch,
      ...offers.giftCardDenominations,
    ];
    for (const amount of amounts) expect(isCents(amount), String(amount)).toBe(true);
    expect(new Set(offers.giftCardDenominations).size).toBe(offers.giftCardDenominations.length);
  });

  it("never makes a bundle dearer than buying its sticks in smaller groups (needed for D13)", () => {
    const { 1: one, 2: two, 3: three } = offers.stickPricing;
    expect(two).toBeLessThanOrEqual(2 * one);
    expect(three).toBeLessThanOrEqual(one + two);
    expect(three).toBeLessThanOrEqual(3 * one);
    // Price per stick falls with the bundle size, so the 3-stick tile is "Best value" (brief §2.7).
    expect(three * 2).toBeLessThan(two * 3);
    expect(two).toBeLessThan(2 * one);
  });
});

describe("offers (brief §4, D11, D12)", () => {
  it("gives one free Travel Pouch per order from 3 sticks", () => {
    expect(offers.freePouch).toEqual({ minSticks: 3, productSlug: "travel-pouch", perOrder: 1 });
  });

  it("takes 15% off subscriptions every 1, 2 or 3 months", () => {
    expect(offers.subscription.discountPercent).toBe(15);
    expect(offers.subscription.intervalsMonths).toEqual([1, 2, 3]);
    expect(offers.subscription.intervalsMonths).toContain(offers.subscription.defaultIntervalMonths);
  });

  it("keeps the guarantee apart from the statutory 14-day withdrawal period", () => {
    expect(offers.guaranteeDays).toBe(30);
    expect(offers.withdrawalDays).toBe(14);
  });
});

describe("discount codes (D08, D09)", () => {
  it("has codes that stay unique after trimming and upper-casing", () => {
    const normalised = offers.discountCodes.map((code) => normalizeDiscountCode(code.code));
    expect(new Set(normalised).size).toBe(normalised.length);
    for (const code of offers.discountCodes) {
      expect(code.code, code.code).toBe(normalizeDiscountCode(code.code));
      expect(code.code).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it("only has percent codes between 1 and 99 with a label", () => {
    for (const code of offers.discountCodes) {
      expect(code.kind, code.code).toBe("percent");
      expect(Number.isInteger(code.value) && code.value > 0 && code.value < 100, code.code).toBe(true);
      expect(code.label.trim().length, code.code).toBeGreaterThan(0);
    }
  });

  it("has a 10% WELCOME10 code for the popup", () => {
    expect(offers.welcomeCode).toBe("WELCOME10");
    expect(offers.discountCodes.find((code) => code.code === "WELCOME10")).toMatchObject({
      kind: "percent",
      value: 10,
      source: "welcome",
      active: true,
    });
  });

  it("writes every code window as a parseable ISO timestamp with an offset, start before end", () => {
    const isoWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?[+-]\d{2}:\d{2}$/;
    for (const code of offers.discountCodes) {
      for (const iso of [code.startsAt, code.endsAt]) {
        if (iso === undefined) continue;
        expect(iso, code.code).toMatch(isoWithOffset);
        expect(Number.isNaN(Date.parse(iso)), code.code).toBe(false);
      }
      if (code.startsAt !== undefined && code.endsAt !== undefined) {
        expect(Date.parse(code.startsAt), code.code).toBeLessThan(Date.parse(code.endsAt));
      }
    }
  });
});

describe("launch campaign (D08)", () => {
  it("runs from 25 October 2026 00:00 CEST to 1 November 2026 23:59:59 CET", () => {
    expect(offers.campaign.startsAt).toBe("2026-10-25T00:00:00+02:00");
    expect(offers.campaign.endsAt).toBe("2026-11-01T23:59:59+01:00");
    expect(Date.parse(offers.campaign.endsAt) - Date.parse("2026-10-25T00:00:00+02:00")).toBe(
      (8 * 24 + 1) * 3_600_000 - 1_000,
    );
  });

  it("promotes LAUNCH15, a campaign code with the same window", () => {
    expect(offers.campaign.code).toBe("LAUNCH15");
    const code = offers.discountCodes.find((candidate) => candidate.code === offers.campaign.code);
    expect(code).toMatchObject({
      value: 15,
      source: "campaign",
      active: true,
      startsAt: offers.campaign.startsAt,
      endsAt: offers.campaign.endsAt,
    });
  });

  it("names the code, its value and the gift card exclusion in the bar message", () => {
    expect(offers.campaign.message).toContain("LAUNCH15");
    expect(offers.campaign.message).toContain("15%");
    expect(offers.campaign.message).toMatch(/gift cards/i);
    expect(offers.campaign.message).toContain(offers.campaign.name);
  });
});
