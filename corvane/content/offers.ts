import type { DiscountCode, OffersConfig } from "@/lib/types";

/** The campaign code. The promo bar message is derived from it, so the two can never disagree. */
const launchCode: DiscountCode = {
  code: "LAUNCH15",
  kind: "percent",
  value: 15,
  label: "15% off during launch week",
  source: "campaign",
  active: true,
  startsAt: "2026-10-25T00:00:00+02:00",
  endsAt: "2026-11-01T23:59:59+01:00",
};

const campaignName = "Launch week";

/**
 * Prices, offers and codes. All amounts in euro cents, VAT included.
 * Pricing rules live in lib/pricing.ts; see docs/PLAN.md §7.
 */
export const offers: OffersConfig = {
  currency: "EUR",

  // Sticks are grouped per plan: every 3 at 59.95, a remainder of 2 at 44.95,
  // a remainder of 1 at 24.95.
  stickPricing: {
    1: 2495,
    2: 4495,
    3: 5995,
  },

  prices: {
    discoverySet: 2995,
    travelPouch: 995,
  },

  giftCardDenominations: [2500, 5000, 10000],

  freePouch: {
    minSticks: 3,
    productSlug: "travel-pouch",
    perOrder: 1,
  },

  subscription: {
    discountPercent: 15,
    intervalsMonths: [1, 2, 3],
    defaultIntervalMonths: 2,
  },

  guaranteeDays: 30,
  withdrawalDays: 14,

  discountCodes: [
    {
      code: "WELCOME10",
      kind: "percent",
      value: 10,
      label: "10% off your first order",
      source: "welcome",
      active: true,
    },
    launchCode,
  ],

  welcomeCode: "WELCOME10",

  // Demo launch campaign: ends 7 days after the build date (2026-10-25).
  // Must become a real, planned promotion before going live (docs/TODO-LAUNCH.md).
  campaign: {
    active: true,
    name: campaignName,
    // Names only what really ends: the code, with its conditions (D08, D09).
    message: `${campaignName}: ${launchCode.value}% off with code ${launchCode.code}. Excludes gift cards.`,
    startsAt: "2026-10-25T00:00:00+02:00",
    endsAt: "2026-11-01T23:59:59+01:00",
    code: launchCode.code,
  },
};
