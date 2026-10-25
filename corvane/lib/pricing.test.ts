import { describe, expect, it } from "vitest";
import { offers } from "@/content/offers";
import { shipping } from "@/content/shipping";
import {
  bundleUnitPrice,
  cartLineId,
  defaultPricingConfig,
  discountWindowStart,
  getBundleTileQuote,
  groupSticks,
  priceCart,
  purchaseTypeOf,
  quoteShipping,
  stickGroupTotal,
  validateDiscountCode,
  type PricingConfig,
} from "@/lib/pricing";
import type { CartLine, CountryCode, NewCartLine, PurchasePlan } from "@/lib/types";

const ONE_TIME: PurchasePlan = { type: "one-time" };
const SUB_1: PurchasePlan = { type: "subscription", intervalMonths: 1 };
const SUB_2: PurchasePlan = { type: "subscription", intervalMonths: 2 };

/** Inside the launch campaign window (Amsterdam winter time). */
const NOW = new Date("2026-10-30T12:00:00+01:00");

function withId(line: NewCartLine): CartLine {
  return { ...line, id: cartLineId(line) } as CartLine;
}

function stick(scents: string[], plan: PurchasePlan = ONE_TIME, quantity = 1): CartLine {
  return withId({ kind: "stick", scents, plan, quantity });
}

function pouch(quantity = 1): CartLine {
  return withId({ kind: "pouch", slug: "travel-pouch", quantity });
}

function discoverySet(quantity = 1): CartLine {
  return withId({ kind: "discovery-set", slug: "discovery-set", quantity });
}

function giftCard(amount: number, quantity = 1): CartLine {
  return withId({ kind: "gift-card", slug: "e-gift-card", amount, quantity });
}

function price(lines: CartLine[], discountCode: string | null = null, now = NOW, config?: PricingConfig) {
  return priceCart({ lines, discountCode, country: "NL", now }, config);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function withCampaign(patch: Partial<PricingConfig["offers"]["campaign"]>): PricingConfig {
  return {
    ...defaultPricingConfig,
    offers: { ...offers, campaign: { ...offers.campaign, ...patch } },
  };
}

describe("purchaseTypeOf and cartLineId", () => {
  it("maps plans to purchase types", () => {
    expect(purchaseTypeOf(ONE_TIME)).toBe("one-time");
    expect(purchaseTypeOf(SUB_2)).toBe("subscription");
    expect(purchaseTypeOf("subscription")).toBe("subscription");
  });

  it("builds deterministic ids that ignore scent order", () => {
    const a: NewCartLine = { kind: "stick", scents: ["north-swell", "drift-and-ember"], plan: ONE_TIME, quantity: 1 };
    const b: NewCartLine = { kind: "stick", scents: ["drift-and-ember", "north-swell"], plan: ONE_TIME, quantity: 3 };
    expect(cartLineId(a)).toBe("stick:drift-and-ember+north-swell:one-time");
    expect(cartLineId(b)).toBe(cartLineId(a));
    expect(cartLineId({ kind: "stick", scents: ["north-swell"], plan: SUB_2, quantity: 1 })).toBe(
      "stick:north-swell:sub-2",
    );
    expect(cartLineId({ kind: "gift-card", slug: "e-gift-card", amount: 5000, quantity: 1 })).toBe("gift-card:5000");
    expect(cartLineId({ kind: "discovery-set", slug: "discovery-set", quantity: 1 })).toBe("discovery-set");
    expect(cartLineId({ kind: "pouch", slug: "travel-pouch", quantity: 1 })).toBe("pouch");
  });

  it("does not reorder the scents of the input line", () => {
    const scents = ["north-swell", "dune-fig"];
    cartLineId({ kind: "stick", scents, plan: ONE_TIME, quantity: 1 });
    expect(scents).toEqual(["north-swell", "dune-fig"]);
  });
});

describe("bundle prices (PLAN §7 fixed values)", () => {
  it("prices one bundle per size and plan", () => {
    expect([1, 2, 3].map((size) => bundleUnitPrice(size as 1 | 2 | 3, "one-time"))).toEqual([2495, 4495, 5995]);
    // 15% off per bundle, rounded per bundle (D12).
    expect([1, 2, 3].map((size) => bundleUnitPrice(size as 1 | 2 | 3, "subscription"))).toEqual([2121, 3821, 5096]);
  });

  it("groups sticks in threes, then a remainder of 2 or 1", () => {
    expect(groupSticks(0)).toEqual([]);
    expect(groupSticks(1)).toEqual([{ size: 1, count: 1, groupPrice: 2495 }]);
    expect(groupSticks(5)).toEqual([
      { size: 3, count: 1, groupPrice: 5995 },
      { size: 2, count: 1, groupPrice: 4495 },
    ]);
    expect(groupSticks(7)).toEqual([
      { size: 3, count: 2, groupPrice: 5995 },
      { size: 1, count: 1, groupPrice: 2495 },
    ]);
    expect(groupSticks(8, "subscription")).toEqual([
      { size: 3, count: 2, groupPrice: 5096 },
      { size: 2, count: 1, groupPrice: 3821 },
    ]);
  });

  const oneTime: [number, number][] = [
    [1, 2495],
    [2, 4495],
    [3, 5995],
    [4, 8490],
    [5, 10490],
    [6, 11990],
    [7, 14485],
  ];

  it.each(oneTime)("one-time %i sticks cost %i", (count, expected) => {
    expect(stickGroupTotal(count, "one-time")).toBe(expected);
    const summary = price([stick(["north-swell"], ONE_TIME, count)]);
    expect(summary.subtotal).toBe(expected);
    expect(summary.groups).toHaveLength(1);
    expect(summary.groups[0].total).toBe(expected);
  });

  const subscription: [number, number][] = [
    [1, 2121],
    [2, 3821],
    [3, 5096],
    [4, 7217],
    [7, 12313],
    [8, 14013],
  ];

  it.each(subscription)("subscription %i sticks cost %i", (count, expected) => {
    expect(stickGroupTotal(count, "subscription")).toBe(expected);
    const summary = price([stick(["harbour-tea"], SUB_2, count)]);
    expect(summary.subtotal).toBe(expected);
    expect(summary.groups[0].purchaseType).toBe("subscription");
  });

  it("groups per purchase type: 2 one-time + 1 subscription = 4495 + 2121", () => {
    const summary = price([stick(["north-swell", "dune-fig"]), stick(["iron-coast"], SUB_1)]);
    expect(summary.groups.map((group) => [group.purchaseType, group.total])).toEqual([
      ["one-time", 4495],
      ["subscription", 2121],
    ]);
    expect(summary.subtotal).toBe(4495 + 2121);
  });

  it("matches the e2e cart subtotals for 1, 2, 3, 4 and 7 single-stick lines", () => {
    const scents = ["north-swell", "drift-and-ember", "lantern-smoke", "dune-fig", "iron-coast", "harbour-tea"];
    const expected: Record<number, number> = { 1: 2495, 2: 4495, 3: 5995, 4: 8490, 7: 14485 };
    for (const [count, total] of Object.entries(expected)) {
      const lines = Array.from({ length: Math.min(Number(count), 6) }, (_, index) => stick([scents[index]]));
      if (Number(count) === 7) lines[0] = stick([scents[0]], ONE_TIME, 2);
      expect(price(lines).subtotal).toBe(total);
    }
  });
});

describe("allocation over lines (D13)", () => {
  function expectAllocation(lines: CartLine[], groupTotal: number) {
    const summary = price(lines);
    expect(sum(summary.lines.map((line) => line.total))).toBe(groupTotal);
    for (const line of summary.lines) {
      expect(line.total).toBeLessThanOrEqual(line.standaloneTotal);
      expect(line.total).toBeGreaterThanOrEqual(0);
    }
    return summary;
  }

  it("lines of 1 + 1 + 2 sticks group to 8490", () => {
    const summary = expectAllocation(
      [stick(["north-swell"]), stick(["drift-and-ember"]), stick(["lantern-smoke", "dune-fig"])],
      8490,
    );
    expect(summary.groups[0].bundles).toEqual([
      { size: 3, count: 1, groupPrice: 5995 },
      { size: 1, count: 1, groupPrice: 2495 },
    ]);
    // Pro rata by standalone price, floor for all but the last line.
    expect(summary.lines.map((line) => line.total)).toEqual([2233, 2233, 4024]);
  });

  it("a 3-scent line plus a 1-stick line keeps both tile prices", () => {
    const threeFirst = expectAllocation([stick(["north-swell", "dune-fig", "iron-coast"]), stick(["harbour-tea"])], 8490);
    expect(threeFirst.lines.map((line) => line.total)).toEqual([5995, 2495]);
    const oneFirst = expectAllocation([stick(["harbour-tea"]), stick(["north-swell", "dune-fig", "iron-coast"])], 8490);
    expect(oneFirst.lines.map((line) => line.total)).toEqual([2495, 5995]);
  });

  it("two 2-stick lines: each at most 4495, together 8490", () => {
    const summary = expectAllocation([stick(["north-swell", "dune-fig"]), stick(["iron-coast", "harbour-tea"])], 8490);
    for (const line of summary.lines) expect(line.total).toBeLessThanOrEqual(4495);
  });

  it("pools subscription lines with different intervals into one group", () => {
    const summary = price([stick(["north-swell"], SUB_1), stick(["dune-fig", "iron-coast"], SUB_2)]);
    expect(summary.groups).toHaveLength(1);
    expect(summary.groups[0]).toMatchObject({ purchaseType: "subscription", stickCount: 3, total: 5096 });
    expect(sum(summary.lines.map((line) => line.total))).toBe(5096);
    for (const line of summary.lines) expect(line.total).toBeLessThanOrEqual(line.standaloneTotal);
  });

  it("keeps every line at or below its tile price for many line combinations", () => {
    const scentSets = [["north-swell"], ["dune-fig", "iron-coast"], ["harbour-tea", "lantern-smoke", "drift-and-ember"]];
    const plans = [ONE_TIME, SUB_1];
    for (let mask = 0; mask < 3 ** 4; mask += 1) {
      const lines: CartLine[] = [];
      const linePlans: PurchasePlan[] = [];
      let rest = mask;
      for (let index = 0; index < 4; index += 1) {
        const size = rest % 3;
        rest = Math.floor(rest / 3);
        linePlans.push(plans[index % 2]);
        lines.push({ ...stick(scentSets[size], plans[index % 2], (index % 3) + 1), id: `line-${index}` });
      }
      const summary = price(lines);
      expect(summary.lines).toHaveLength(4);
      for (const group of summary.groups) {
        const members = summary.lines.filter((_, index) => purchaseTypeOf(linePlans[index]) === group.purchaseType);
        expect(sum(members.map((line) => line.total))).toBe(group.total);
      }
      for (const line of summary.lines) expect(line.total).toBeLessThanOrEqual(line.standaloneTotal);
    }
  });

  it("keeps the invariant in a large cart where floor rounding piles up on the last line", () => {
    const lines = [
      ...Array.from({ length: 30 }, (_, index) => ({
        ...stick(["north-swell", "dune-fig", "iron-coast"]),
        id: `three-${index}`,
      })),
      stick(["harbour-tea"]),
      stick(["lantern-smoke"]),
    ];
    const summary = price(lines);
    expect(summary.groups[0].stickCount).toBe(92);
    expect(sum(summary.lines.map((line) => line.total))).toBe(stickGroupTotal(92, "one-time"));
    for (const line of summary.lines) expect(line.total).toBeLessThanOrEqual(line.standaloneTotal);
  });
});

describe("free Travel Pouch (D11)", () => {
  it("adds a gift pouch from 3 sticks when there is no pouch line", () => {
    const summary = price([stick(["north-swell", "dune-fig", "iron-coast"])]);
    expect(summary.freePouch).toEqual({ eligible: true, appliedToLineId: null, value: 995, sticksNeeded: 0 });
    expect(summary.pouchSavings).toBe(995);
    expect(summary.subtotal).toBe(5995);
  });

  it("is not eligible below 3 sticks and says how many are missing", () => {
    const summary = price([stick(["north-swell", "dune-fig"]), pouch()]);
    expect(summary.freePouch).toMatchObject({ eligible: false, appliedToLineId: null, sticksNeeded: 1 });
    expect(summary.pouchSavings).toBe(0);
    expect(summary.lines[1]).toMatchObject({ total: 995, includesFreePouch: false });
    expect(price([pouch()]).freePouch.sticksNeeded).toBe(3);
  });

  it("makes an existing pouch line free", () => {
    const summary = price([stick(["north-swell", "dune-fig", "iron-coast"]), pouch()]);
    expect(summary.freePouch).toMatchObject({ eligible: true, appliedToLineId: "pouch" });
    expect(summary.lines[1]).toMatchObject({ standaloneTotal: 995, total: 0, includesFreePouch: true });
    expect(summary.subtotal).toBe(5995);
    expect(summary.pouchSavings).toBe(995);
  });

  it("makes only one pouch free per order", () => {
    const summary = price([stick(["north-swell"], ONE_TIME, 3), pouch(2)]);
    expect(summary.lines[1]).toMatchObject({ standaloneTotal: 1990, total: 995, includesFreePouch: true });
    expect(summary.subtotal).toBe(5995 + 995);
    expect(summary.pouchSavings).toBe(995);
  });

  it("counts sticks of both purchase types together", () => {
    const summary = price([stick(["north-swell", "dune-fig"]), stick(["iron-coast"], SUB_1)]);
    expect(summary.stickCount).toBe(3);
    expect(summary.freePouch.eligible).toBe(true);
    expect(summary.pouchSavings).toBe(995);
  });
});

describe("discount codes", () => {
  it("accepts codes with spaces and lower case", () => {
    const result = validateDiscountCode("  welcome10 ", NOW);
    expect(result.valid).toBe(true);
    const summary = price([stick(["north-swell"])], " Welcome10 ");
    expect(summary.discount).toEqual({ code: "WELCOME10", label: "10% off your first order", amount: 250 });
  });

  it("WELCOME10 on 1 stick rounds half up (2495 -> 250)", () => {
    const summary = price([stick(["north-swell"])], "WELCOME10");
    expect(summary.discount?.amount).toBe(250);
    expect(summary.subtotal).toBe(2245);
    expect(summary.total).toBe(2245 + 495);
  });

  it("WELCOME10 on 3 sticks is 600", () => {
    const summary = price([stick(["north-swell", "dune-fig", "iron-coast"])], "WELCOME10");
    expect(summary.discount?.amount).toBe(600);
    expect(summary.subtotal).toBe(5395);
  });

  it("LAUNCH15 is valid during the campaign", () => {
    expect(validateDiscountCode("LAUNCH15", new Date("2026-10-30T12:00:00Z")).valid).toBe(true);
    expect(validateDiscountCode("launch15", new Date("2026-11-01T22:59:58.999Z")).valid).toBe(true);
    // 15% of 4495 = 674.25 -> 674.
    expect(price([stick(["north-swell", "dune-fig"])], "LAUNCH15").discount?.amount).toBe(674);
  });

  it("LAUNCH15 expires at endsAt (exclusive) and stays expired", () => {
    // 2026-11-01T23:59:59+01:00 is 22:59:59Z.
    expect(validateDiscountCode("LAUNCH15", new Date("2026-11-01T22:59:59Z"))).toEqual({ valid: false, error: "expired" });
    expect(validateDiscountCode("LAUNCH15", new Date("2026-11-02T09:00:00Z"))).toEqual({ valid: false, error: "expired" });
    const summary = price([stick(["north-swell"])], "LAUNCH15", new Date("2026-11-01T22:59:59Z"));
    expect(summary.discount).toBeNull();
    expect(summary.discountError).toBe("expired");
    expect(summary.subtotal).toBe(2495);
  });

  it("LAUNCH15 has not started before startsAt", () => {
    // 2026-10-25T00:00:00+02:00 is 2026-10-24T22:00:00Z.
    expect(validateDiscountCode("LAUNCH15", new Date("2026-10-24T21:59:59Z"))).toEqual({
      valid: false,
      error: "not-started",
    });
    expect(validateDiscountCode("LAUNCH15", new Date("2026-10-24T22:00:00Z")).valid).toBe(true);
  });

  it("LAUNCH15 is rejected when the campaign is not active", () => {
    const config = withCampaign({ active: false });
    expect(validateDiscountCode("LAUNCH15", NOW, config)).toEqual({ valid: false, error: "inactive" });
    expect(price([stick(["north-swell"])], "LAUNCH15", NOW, config).discountError).toBe("inactive");
  });

  it("LAUNCH15 is rejected when the campaign names another code or has ended", () => {
    expect(validateDiscountCode("LAUNCH15", NOW, withCampaign({ code: undefined })).valid).toBe(false);
    expect(
      validateDiscountCode("LAUNCH15", NOW, withCampaign({ endsAt: "2026-10-29T00:00:00+01:00" })),
    ).toEqual({ valid: false, error: "expired" });
  });

  it("discountWindowStart snaps to the last code boundary, so pricing there equals pricing now", () => {
    const start = Date.parse("2026-10-25T00:00:00+02:00");
    const end = Date.parse("2026-11-01T23:59:59+01:00");
    expect(discountWindowStart(new Date(start - 1))).toBe(0);
    expect(discountWindowStart(new Date(start))).toBe(start);
    expect(discountWindowStart(NOW)).toBe(start);
    expect(discountWindowStart(new Date(end - 1))).toBe(start);
    expect(discountWindowStart(new Date(end))).toBe(end);
    expect(discountWindowStart(new Date("2027-01-01T00:00:00Z"))).toBe(end);

    const instants = [start - 1, start, NOW.getTime(), end - 1000, end - 1, end, end + 30_000];
    for (const at of instants) {
      const now = new Date(at);
      const snapped = new Date(discountWindowStart(now));
      for (const code of ["LAUNCH15", "WELCOME10"]) {
        expect(validateDiscountCode(code, snapped), `${code} at ${now.toISOString()}`).toEqual(
          validateDiscountCode(code, now),
        );
      }
    }
  });

  it("rejects inactive codes", () => {
    const config: PricingConfig = {
      ...defaultPricingConfig,
      offers: {
        ...offers,
        discountCodes: offers.discountCodes.map((code) => ({ ...code, active: false })),
      },
    };
    expect(validateDiscountCode("WELCOME10", NOW, config)).toEqual({ valid: false, error: "inactive" });
  });

  it("an unknown code gives an error and no discount", () => {
    expect(validateDiscountCode("FREESTUFF", NOW)).toEqual({ valid: false, error: "unknown" });
    const summary = price([stick(["north-swell"])], "FREESTUFF");
    expect(summary.discount).toBeNull();
    expect(summary.discountError).toBe("unknown");
    expect(summary.subtotal).toBe(2495);
  });

  it("treats an empty or blank code as no code", () => {
    expect(price([stick(["north-swell"])], "   ").discountError).toBeNull();
    expect(price([stick(["north-swell"])], "").discount).toBeNull();
  });

  it("never discounts gift cards", () => {
    const summary = price([stick(["north-swell"]), giftCard(5000)], "WELCOME10");
    expect(summary.discount?.amount).toBe(250);
    expect(summary.subtotal).toBe(2495 + 5000 - 250);

    const onlyGift = price([giftCard(10000)], "WELCOME10");
    expect(onlyGift.discount).toBeNull();
    expect(onlyGift.discountError).toBe("nothing-eligible");
    expect(onlyGift.subtotal).toBe(10000);
  });

  it("applies after the free pouch and discounts the Discovery Set", () => {
    const summary = price([stick(["north-swell"], ONE_TIME, 3), pouch(), discoverySet()], "WELCOME10");
    // Eligible: 5995 + 0 + 2995 = 8990 -> 899.
    expect(summary.discount?.amount).toBe(899);
  });
});

describe("shipping (D14)", () => {
  it("charges 495 below 5000 and nothing from 5000", () => {
    expect(quoteShipping("NL", 4999, true)).toEqual({
      country: "NL",
      requiresShipping: true,
      basis: 4999,
      amount: 495,
      isFree: false,
      freeFrom: 5000,
      remainingForFree: 1,
    });
    expect(quoteShipping("NL", 5000, true)).toMatchObject({ amount: 0, isFree: true, remainingForFree: 0 });
    expect(quoteShipping("BE", 2495, true)).toMatchObject({ country: "BE", amount: 495, remainingForFree: 2505 });
  });

  it("falls back to the default country for an unknown code", () => {
    expect(quoteShipping("DE" as CountryCode, 100, true).country).toBe(shipping.defaultCountry);
  });

  it("prices shipping in the cart", () => {
    expect(price([stick(["north-swell"])]).shipping).toMatchObject({ amount: 495, basis: 2495, remainingForFree: 2505 });
    const free = price([stick(["north-swell", "dune-fig"]), discoverySet()]);
    expect(free.shipping).toMatchObject({ amount: 0, isFree: true, basis: 7490 });
    expect(free.total).toBe(7490);
  });

  it("2 sticks + pouch with WELCOME10 still ships free (basis 5490 before the code)", () => {
    const summary = price([stick(["north-swell", "dune-fig"]), pouch()], "WELCOME10");
    expect(summary.shipping).toMatchObject({ basis: 5490, amount: 0, isFree: true });
    expect(summary.discount?.amount).toBe(549);
    expect(summary.subtotal).toBe(4941);
    expect(summary.total).toBe(4941);
  });

  it("gift cards do not count towards free shipping", () => {
    const summary = price([stick(["north-swell"]), giftCard(5000)]);
    expect(summary.shipping).toMatchObject({ basis: 2495, amount: 495, requiresShipping: true });
    expect(summary.total).toBe(2495 + 5000 + 495);
  });

  it("a gift-card-only order has no shipping", () => {
    const summary = price([giftCard(5000, 2)]);
    expect(summary.shipping).toMatchObject({ requiresShipping: false, amount: 0, isFree: false, remainingForFree: 0 });
    expect(summary.total).toBe(10000);
  });

  it("an empty cart has no shipping and costs nothing", () => {
    const summary = price([]);
    expect(summary.shipping).toMatchObject({ requiresShipping: false, amount: 0, remainingForFree: 0 });
    expect(summary.total).toBe(0);
    expect(summary.itemCount).toBe(0);
  });
});

describe("savings", () => {
  it("adds bundle and pouch savings for 7 one-time sticks", () => {
    const summary = price([stick(["north-swell"], ONE_TIME, 7)]);
    expect(summary.listTotal).toBe(7 * 2495);
    expect(summary.bundleSavings).toBe(7 * 2495 - 14485);
    expect(summary.subscriptionSavings).toBe(0);
    expect(summary.pouchSavings).toBe(995);
    expect(summary.totalSavings).toBe(2980 + 995);
  });

  it("adds bundle, subscription, pouch and code savings", () => {
    const summary = price([stick(["north-swell", "dune-fig"], SUB_1, 2)], "WELCOME10");
    expect(summary.groups[0]).toMatchObject({ listTotal: 9980, bundleTotal: 8490, subscriptionDiscount: 1273, total: 7217 });
    expect(summary.bundleSavings).toBe(1490);
    expect(summary.subscriptionSavings).toBe(1273);
    expect(summary.pouchSavings).toBe(995);
    // 10% of 7217 = 721.7 -> 722.
    expect(summary.discount?.amount).toBe(722);
    expect(summary.totalSavings).toBe(1490 + 1273 + 995 + 722);
    expect(summary.subtotal).toBe(7217 - 722);
    expect(summary.shipping.amount).toBe(0);
  });

  it("has no savings for a single stick", () => {
    expect(price([stick(["north-swell"])]).totalSavings).toBe(0);
  });
});

describe("item count and invalid lines", () => {
  it("counts each stick once and other items by quantity", () => {
    const summary = price([stick(["north-swell", "dune-fig"], ONE_TIME, 2), discoverySet(), pouch(2), giftCard(2500, 3)]);
    expect(summary.stickCount).toBe(4);
    expect(summary.itemCount).toBe(4 + 1 + 2 + 3);
  });

  it("skips lines with a bad quantity, kind, scent count or gift card amount", () => {
    const bad = [
      stick(["north-swell"], ONE_TIME, 0),
      stick(["north-swell"], ONE_TIME, -2),
      stick([], ONE_TIME, 1),
      stick(["north-swell", "dune-fig", "iron-coast", "harbour-tea"], ONE_TIME, 1),
      { id: "mystery", kind: "candle", quantity: 1 } as unknown as CartLine,
      giftCard(1234),
      discoverySet(1.5),
    ];
    const summary = price([...bad, stick(["lantern-smoke"])]);
    expect(summary.lines.map((line) => line.lineId)).toEqual(["stick:lantern-smoke:one-time"]);
    expect(summary.subtotal).toBe(2495);
    expect(summary.itemCount).toBe(1);
  });

  it("reports line list, standalone and final totals", () => {
    const summary = price([stick(["north-swell", "dune-fig", "iron-coast"], SUB_2)]);
    expect(summary.lines[0]).toEqual({
      lineId: "stick:dune-fig+iron-coast+north-swell:sub-2",
      stickCount: 3,
      listTotal: 7485,
      standaloneTotal: 5096,
      total: 5096,
      includesFreePouch: false,
    });
  });
});

describe("bundle tile quotes (PLAN §7 rule 10)", () => {
  it("quotes one-time tiles", () => {
    const quotes = ([1, 2, 3] as const).map((size) => getBundleTileQuote(size, ONE_TIME));
    expect(quotes.map((quote) => quote.total)).toEqual([2495, 4495, 5995]);
    expect(quotes.map((quote) => quote.perStick)).toEqual([2495, 2248, 1998]);
    expect(quotes.map((quote) => quote.listTotal)).toEqual([2495, 4990, 7485]);
    expect(quotes.map((quote) => quote.savings)).toEqual([0, 495, 1490]);
    expect(quotes.map((quote) => quote.subscriptionSavings)).toEqual([0, 0, 0]);
    expect(quotes.map((quote) => quote.isBestValue)).toEqual([false, false, true]);
    expect(quotes.map((quote) => quote.includesFreePouch)).toEqual([false, false, true]);
    expect(quotes.every((quote) => quote.pouchValue === 995)).toBe(true);
  });

  it("quotes subscription tiles", () => {
    const quotes = ([1, 2, 3] as const).map((size) => getBundleTileQuote(size, SUB_2));
    expect(quotes.map((quote) => quote.total)).toEqual([2121, 3821, 5096]);
    expect(quotes.map((quote) => quote.purchaseType)).toEqual(["subscription", "subscription", "subscription"]);
    expect(quotes.map((quote) => quote.savings)).toEqual([0, 495, 1490]);
    expect(quotes.map((quote) => quote.subscriptionSavings)).toEqual([374, 674, 899]);
    expect(quotes.map((quote) => quote.totalSavings)).toEqual([374, 1169, 2389]);
    expect(quotes.map((quote) => quote.isBestValue)).toEqual([false, false, true]);
    expect(getBundleTileQuote(3, "subscription")).toEqual(quotes[2]);
  });

  it("matches what the cart charges for the same tile", () => {
    for (const size of [1, 2, 3] as const) {
      for (const plan of [ONE_TIME, SUB_1]) {
        const scents = ["north-swell", "dune-fig", "iron-coast"].slice(0, size);
        expect(price([stick(scents, plan)]).subtotal).toBe(getBundleTileQuote(size, plan).total);
      }
    }
  });
});
