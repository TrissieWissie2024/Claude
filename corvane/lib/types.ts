/**
 * Shared types for CORVANE. All money values are integer euro cents.
 * See docs/PLAN.md §6 for the data model and §7 for the pricing rules.
 */

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export type ScentFamily = "Fresh" | "Woody" | "Dark" | "Green" | "Citrus" | "Aromatic";

/** Manual merchandising flags. At launch only "new" may be set (brief §2.7). */
export type BadgeId = "new" | "best-seller" | "most-popular";

export type ProductKind = "stick" | "discovery-set" | "pouch" | "gift-card";

export type Scale = 1 | 2 | 3 | 4 | 5;

export interface ProductBase {
  slug: string;
  name: string;
  kind: ProductKind;
  /** One line for product cards. */
  tagline: string;
  /** Short description for the product page. */
  description: string;
  badges: BadgeId[];
  /** Lower comes first in the "featured" sort. */
  featuredRank: number;
  /** ISO date (YYYY-MM-DD), used by the "newest" sort. */
  releasedAt: string;
  /**
   * Only set when this was genuinely the lowest price in the 30 days before
   * the current price took effect (brief §2.4). Unset for every product at launch.
   */
  previousPrice?: { amount: number; lowestPriceLast30Days: true };
  seo: { title: string; description: string };
  /** Mapping for an external commerce backend (see lib/commerce/shopify.ts). */
  externalIds?: {
    shopifyHandle?: string;
    /** Variant ids keyed by our variant key (e.g. a gift card amount). */
    shopifyVariantIds?: Record<string, string>;
    /** Selling plan ids for Subscribe & save, keyed by interval in months. */
    shopifySellingPlanIds?: Partial<Record<SubscriptionInterval, string>>;
  };
}

export interface ScentNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface StickProduct extends ProductBase {
  kind: "stick";
  family: ScentFamily;
  notes: ScentNotes;
  /** Hex colour of the ring at the base of the stick. */
  ringColor: string;
  /** Indicative only, shown with an "Indicative" label. */
  intensity: { freshWarm: Scale; projection: Scale };
  /** Short mood line, e.g. where and when it fits. */
  mood: string;
}

/** Prices of all products live in content/offers.ts (brief §4), not here. */
export interface DiscoverySetProduct extends ProductBase {
  kind: "discovery-set";
  /** e.g. "Six 3 g mini sticks, one of each scent". */
  contents: string;
}

export interface PouchProduct extends ProductBase {
  kind: "pouch";
}

export interface GiftCardProduct extends ProductBase {
  kind: "gift-card";
}

export type Product = StickProduct | DiscoverySetProduct | PouchProduct | GiftCardProduct;

/* ------------------------------------------------------------------ */
/* Offers                                                              */
/* ------------------------------------------------------------------ */

export type BundleSize = 1 | 2 | 3;

export type SubscriptionInterval = 1 | 2 | 3;

/** Bundle grouping happens per purchase type (brief §4), not per interval (D10). */
export type PurchaseType = "one-time" | "subscription";

export type PurchasePlan =
  | { type: "one-time" }
  | { type: "subscription"; intervalMonths: SubscriptionInterval };

export interface DiscountCode {
  code: string;
  kind: "percent";
  /** Percentage, e.g. 10 for 10%. */
  value: number;
  /** Customer-facing description, e.g. "10% off your first order". */
  label: string;
  source: "welcome" | "campaign";
  active: boolean;
  /** ISO timestamps with offset. Outside this window the code is rejected. */
  startsAt?: string;
  endsAt?: string;
}

export interface Campaign {
  active: boolean;
  name: string;
  /** Message for the promo bar. */
  message: string;
  /** Optional start; ISO timestamp with offset. */
  startsAt?: string;
  /** Fixed end; ISO timestamp with offset. The countdown targets this and never resets. */
  endsAt: string;
  /** Optional discount code tied to the campaign (must exist in discountCodes). */
  code?: string;
}

export interface OffersConfig {
  currency: "EUR";
  /** Price of a group of n sticks, in cents. */
  stickPricing: Record<BundleSize, number>;
  /** Prices of the other products, in cents. */
  prices: {
    discoverySet: number;
    travelPouch: number;
  };
  /** E-gift card amounts in cents. Digital, no shipping. */
  giftCardDenominations: number[];
  freePouch: {
    /** Minimum number of sticks in the order. */
    minSticks: number;
    productSlug: "travel-pouch";
    /** Number of free pouches per order. */
    perOrder: number;
  };
  subscription: {
    discountPercent: number;
    intervalsMonths: SubscriptionInterval[];
    defaultIntervalMonths: SubscriptionInterval;
  };
  guaranteeDays: number;
  /** Statutory right of withdrawal (herroepingsrecht), separate from the guarantee. */
  withdrawalDays: number;
  discountCodes: DiscountCode[];
  /** Code revealed by the email capture popup. Must exist in discountCodes. */
  welcomeCode: string;
  campaign: Campaign;
}

/* ------------------------------------------------------------------ */
/* Shipping                                                            */
/* ------------------------------------------------------------------ */

export type CountryCode = "NL" | "BE";

export interface ShippingCountry {
  code: CountryCode;
  name: string;
  /** Public holidays in this country on which parcels are not delivered. */
  deliveryHolidays: Holiday[];
  /** Flat rate in cents. */
  rate: number;
  /** Free shipping from this shippable subtotal (after bundle and subscription pricing, before the discount code, D14), in cents. */
  freeFrom: number;
  /** Transit time in working days after dispatch. */
  transitDays: { min: number; max: number };
}

export interface Holiday {
  /** YYYY-MM-DD in the warehouse time zone. */
  date: string;
  name: string;
}

export interface ShippingConfig {
  /** IANA time zone of the warehouse. */
  timeZone: "Europe/Amsterdam";
  /** Orders placed before this local time on a working day ship the same day. */
  cutoff: { hour: number; minute: number };
  /** ISO weekdays the warehouse ships on (1 = Monday ... 7 = Sunday). */
  dispatchWeekdays: number[];
  /** Days the warehouse (NL) does not ship. Maintain yearly. */
  holidays: Holiday[];
  defaultCountry: CountryCode;
  countries: ShippingCountry[];
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

export interface StickCartLine {
  id: string;
  kind: "stick";
  /** One set as chosen on the product page: 1 to 3 scent slugs (mix and match). */
  scents: string[];
  plan: PurchasePlan;
  /** Number of times this set is ordered. */
  quantity: number;
}

export interface DiscoverySetCartLine {
  id: string;
  kind: "discovery-set";
  slug: "discovery-set";
  quantity: number;
}

export interface PouchCartLine {
  id: string;
  kind: "pouch";
  slug: "travel-pouch";
  quantity: number;
}

export interface GiftCardCartLine {
  id: string;
  kind: "gift-card";
  slug: "e-gift-card";
  /** Denomination in cents. */
  amount: number;
  quantity: number;
}

export type CartLine = StickCartLine | DiscoverySetCartLine | PouchCartLine | GiftCardCartLine;

/** A cart line before it has an id (the cart derives ids). */
export type NewCartLine =
  | Omit<StickCartLine, "id">
  | Omit<DiscoverySetCartLine, "id">
  | Omit<PouchCartLine, "id">
  | Omit<GiftCardCartLine, "id">;

/* ------------------------------------------------------------------ */
/* Pricing results                                                     */
/* ------------------------------------------------------------------ */

export interface BundlePart {
  size: BundleSize;
  count: number;
  /** Price of one group of this size for the plan, in cents. */
  groupPrice: number;
}

export interface PriceGroup {
  purchaseType: PurchaseType;
  stickCount: number;
  bundles: BundlePart[];
  /** Sticks at the single-stick price. */
  listTotal: number;
  /** After bundle pricing, before the subscription discount. */
  bundleTotal: number;
  /** Subscription discount, applied per bundle price and rounded per bundle (D12). */
  subscriptionDiscount: number;
  /** What the customer pays for this group. */
  total: number;
}

export interface PricedLine {
  lineId: string;
  /** Number of sticks in the line (0 for non-stick lines). */
  stickCount: number;
  /** Line at standalone prices (single-stick price for sticks). */
  listTotal: number;
  /** Line as quoted on the product page: its own bundle tile price (incl. subscription) x quantity. */
  standaloneTotal: number;
  /**
   * Line after grouping across lines, subscription and free-pouch pricing, before
   * the order discount code. Never above standaloneTotal (allocation by standalone price, D13).
   */
  total: number;
  /** True when one pouch in this line is the free pouch. */
  includesFreePouch: boolean;
}

export type DiscountError = "unknown" | "inactive" | "expired" | "not-started" | "nothing-eligible";

export interface ShippingQuote {
  country: CountryCode;
  requiresShipping: boolean;
  /** Amount the free-shipping threshold is measured on: shippable items before the discount code (D14). */
  basis: number;
  amount: number;
  isFree: boolean;
  freeFrom: number;
  /** Amount still needed for free shipping (0 once reached). */
  remainingForFree: number;
}

export interface PricingSummary {
  lines: PricedLine[];
  groups: PriceGroup[];
  /** All sticks in the order, across plans. */
  stickCount: number;
  /** Number of individual items (sticks count one each). */
  itemCount: number;
  freePouch: {
    eligible: boolean;
    /** Line id of an existing pouch line that became free, or null if shown as a gift. */
    appliedToLineId: string | null;
    value: number;
    sticksNeeded: number;
  };
  /** Everything at standalone prices. */
  listTotal: number;
  bundleSavings: number;
  subscriptionSavings: number;
  pouchSavings: number;
  discount: { code: string; label: string; amount: number } | null;
  discountError: DiscountError | null;
  /** After all discounts, before shipping. Gift cards included. */
  subtotal: number;
  shipping: ShippingQuote;
  total: number;
  /** bundleSavings + subscriptionSavings + pouchSavings + discount. */
  totalSavings: number;
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export interface Review {
  id: string;
  /** null for a store review. */
  productSlug: string | null;
  author: string;
  rating: Scale;
  title: string;
  body: string;
  /** ISO date. */
  date: string;
  verifiedPurchase: boolean;
  /** Where the review was collected, e.g. "judge.me". */
  source: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export type ClaimId = "longevity" | "applications" | "carry-on";

export interface Claim {
  id: ClaimId;
  /** Customer-facing wording, only shown when verified is true. */
  text: string;
  verified: boolean;
  /** How it will be or was substantiated. */
  evidence: string;
}

export type FaqCategory = "product" | "ordering" | "shipping" | "returns" | "subscription";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  /** Shown in the homepage FAQ section. */
  onHome?: boolean;
  /** Shown on product pages. */
  onProduct?: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}
