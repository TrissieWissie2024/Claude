import { offers as defaultOffers } from "@/content/offers";
import { shipping as defaultShipping } from "@/content/shipping";
import type {
  BundlePart,
  BundleSize,
  CartLine,
  CountryCode,
  DiscountCode,
  DiscountError,
  NewCartLine,
  OffersConfig,
  PriceGroup,
  PricedLine,
  PricingSummary,
  PurchasePlan,
  PurchaseType,
  ShippingConfig,
  ShippingCountry,
  ShippingQuote,
} from "@/lib/types";

/**
 * Pure pricing logic. The spec is docs/PLAN.md §7 and decisions D10 to D14.
 *
 * - Integer cents only. Percentages are always Math.round(cents * pct / 100)
 *   (half up for positive amounts), never a float factor like 0.85.
 * - No React, no clock: time is always passed in as `now`.
 * - Every function takes an optional `config` so tests can inject offers and
 *   shipping; it defaults to content/offers.ts and content/shipping.ts.
 */

/* ------------------------------------------------------------------ */
/* Config and helper types                                             */
/* ------------------------------------------------------------------ */

export interface PricingConfig {
  offers: OffersConfig;
  shipping: ShippingConfig;
}

export const defaultPricingConfig: PricingConfig = {
  offers: defaultOffers,
  shipping: defaultShipping,
};

const BUNDLE_SIZES: readonly BundleSize[] = [1, 2, 3];

const PURCHASE_TYPES: readonly PurchaseType[] = ["one-time", "subscription"];

/** Quote for one bundle tile on the product page (PLAN §7 rule 10). */
export interface BundleTileQuote {
  size: BundleSize;
  purchaseType: PurchaseType;
  /** What the customer pays for this tile (subscription: per delivery). */
  total: number;
  /** total / size, rounded half up. Informational only. */
  perStick: number;
  /** size x the single-stick price. */
  listTotal: number;
  /** Bundle saving: listTotal minus the one-time tile price. Excludes the pouch. */
  savings: number;
  /** Subscription saving on top of the bundle saving (0 for one-time tiles). */
  subscriptionSavings: number;
  /** savings + subscriptionSavings. Excludes the pouch. */
  totalSavings: number;
  /** True when this tile alone reaches the free Travel Pouch (one per order). */
  includesFreePouch: boolean;
  /** Price of the Travel Pouch, for "Free Travel Pouch (worth ...)". */
  pouchValue: number;
  /** True only for the tile with the lowest price per stick for this plan. */
  isBestValue: boolean;
}

export type DiscountValidation =
  | { valid: true; code: DiscountCode }
  | { valid: false; error: Exclude<DiscountError, "nothing-eligible"> };

export interface PriceCartInput {
  lines: readonly CartLine[];
  /** Raw code as typed; trimmed and compared case-insensitively. Empty means none. */
  discountCode?: string | null;
  /** Falls back to the default shipping country when missing or unknown. */
  country?: CountryCode;
  now: Date;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/** Integer percentage of an amount in cents, rounded half up. */
function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** Parses an ISO timestamp; null when it is not a valid date. */
function parseInstant(iso: string | undefined): number | null {
  if (iso === undefined) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Canonical form of a typed discount code: trimmed and upper case. */
export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Plans, ids, bundles                                                 */
/* ------------------------------------------------------------------ */

/** Bundle grouping and subscription pricing depend only on the purchase type (D10). */
export function purchaseTypeOf(plan: PurchasePlan | PurchaseType): PurchaseType {
  const type = typeof plan === "string" ? plan : plan.type;
  return type === "subscription" ? "subscription" : "one-time";
}

/**
 * Deterministic id for a cart line, so the same set with the same plan merges.
 * Scent order does not matter. Examples:
 * "stick:drift-and-ember+north-swell:one-time", "stick:north-swell:sub-2",
 * "gift-card:5000", "discovery-set", "pouch".
 */
export function cartLineId(line: NewCartLine): string {
  switch (line.kind) {
    case "stick": {
      const scents = [...line.scents].sort().join("+");
      const plan = line.plan.type === "subscription" ? `sub-${line.plan.intervalMonths}` : "one-time";
      return `stick:${scents}:${plan}`;
    }
    case "gift-card":
      return `gift-card:${line.amount}`;
    default:
      return line.kind;
  }
}

/**
 * Price of one group of `size` sticks. One-time: offers.stickPricing[size].
 * Subscription: that price minus its discount, rounded per bundle (D12):
 * 3 -> 5096, 2 -> 3821, 1 -> 2121.
 */
export function bundleUnitPrice(
  size: BundleSize,
  purchaseType: PurchaseType = "one-time",
  config: PricingConfig = defaultPricingConfig,
): number {
  const base = config.offers.stickPricing[size];
  if (purchaseType === "one-time") return base;
  return base - percentOf(base, config.offers.subscription.discountPercent);
}

/**
 * Splits `count` sticks into bundles: floor(count / 3) groups of 3, then a
 * remainder group of 2 or 1 (PLAN §7 rule 2). `groupPrice` is the price of one
 * group for the purchase type (one-time by default).
 */
export function groupSticks(
  count: number,
  purchaseType: PurchaseType = "one-time",
  config: PricingConfig = defaultPricingConfig,
): BundlePart[] {
  const sticks = Math.max(0, Math.floor(count));
  const parts: BundlePart[] = [];
  const threes = Math.floor(sticks / 3);
  if (threes > 0) {
    parts.push({ size: 3, count: threes, groupPrice: bundleUnitPrice(3, purchaseType, config) });
  }
  const rest = sticks % 3;
  if (rest === 2 || rest === 1) {
    parts.push({ size: rest, count: 1, groupPrice: bundleUnitPrice(rest, purchaseType, config) });
  }
  return parts;
}

/** Total price of `count` sticks of one purchase type, after grouping. */
export function stickGroupTotal(
  count: number,
  purchaseType: PurchaseType = "one-time",
  config: PricingConfig = defaultPricingConfig,
): number {
  return groupSticks(count, purchaseType, config).reduce(
    (sum, part) => sum + part.count * part.groupPrice,
    0,
  );
}

/* ------------------------------------------------------------------ */
/* Product page tiles                                                  */
/* ------------------------------------------------------------------ */

/**
 * Quote for the 1, 2 or 3 stick tile (PLAN §7 rule 10). One-time per stick:
 * 2495 / 2248 / 1998, savings 0 / 495 / 1490. Subscription totals:
 * 2121 / 3821 / 5096. Only the 3-stick tile is "Best value" and includes the
 * free pouch (with the default config).
 */
export function getBundleTileQuote(
  size: BundleSize,
  plan: PurchasePlan | PurchaseType = "one-time",
  config: PricingConfig = defaultPricingConfig,
): BundleTileQuote {
  const purchaseType = purchaseTypeOf(plan);
  const single = config.offers.stickPricing[1];
  const oneTime = bundleUnitPrice(size, "one-time", config);
  const total = bundleUnitPrice(size, purchaseType, config);
  const listTotal = size * single;
  const savings = listTotal - oneTime;
  const subscriptionSavings = oneTime - total;

  // Lowest price per stick, compared exactly (a/b < c/d <=> a*d < c*b) so
  // rounding of perStick can never create a tie. On an exact tie the larger
  // tile wins.
  let best: BundleSize = 1;
  for (const candidate of BUNDLE_SIZES) {
    const candidateTotal = bundleUnitPrice(candidate, purchaseType, config);
    const bestTotal = bundleUnitPrice(best, purchaseType, config);
    if (candidateTotal * best <= bestTotal * candidate) best = candidate;
  }

  return {
    size,
    purchaseType,
    total,
    perStick: Math.round(total / size),
    listTotal,
    savings,
    subscriptionSavings,
    totalSavings: savings + subscriptionSavings,
    includesFreePouch: size >= config.offers.freePouch.minSticks,
    pouchValue: config.offers.prices.travelPouch,
    isBestValue: size === best,
  };
}

/* ------------------------------------------------------------------ */
/* Discount codes                                                      */
/* ------------------------------------------------------------------ */

/**
 * Checks a typed code (PLAN §7 rule 6). Trimmed and case-insensitive.
 * Windows are startsAt inclusive, endsAt exclusive. A campaign code also needs
 * offers.campaign to be active, to name this code and to be running at `now`.
 */
export function validateDiscountCode(
  code: string,
  now: Date,
  config: PricingConfig = defaultPricingConfig,
): DiscountValidation {
  const wanted = normalizeDiscountCode(code);
  const found = wanted
    ? config.offers.discountCodes.find((candidate) => normalizeDiscountCode(candidate.code) === wanted)
    : undefined;
  if (!found) return { valid: false, error: "unknown" };
  if (!found.active) return { valid: false, error: "inactive" };

  const at = now.getTime();
  const windows: { startsAt?: string; endsAt?: string }[] = [found];

  if (found.source === "campaign") {
    const campaign = config.offers.campaign;
    const campaignCode = campaign.code === undefined ? "" : normalizeDiscountCode(campaign.code);
    if (!campaign.active || campaignCode !== wanted) return { valid: false, error: "inactive" };
    windows.push({ startsAt: campaign.startsAt, endsAt: campaign.endsAt });
  }

  for (const window of windows) {
    const startsAt = parseInstant(window.startsAt);
    const endsAt = parseInstant(window.endsAt);
    // A timestamp that is present but unparseable fails closed.
    if ((window.startsAt !== undefined && startsAt === null) || (window.endsAt !== undefined && endsAt === null)) {
      return { valid: false, error: "inactive" };
    }
    if (startsAt !== null && at < startsAt) return { valid: false, error: "not-started" };
    if (endsAt !== null && at >= endsAt) return { valid: false, error: "expired" };
  }

  return { valid: true, code: found };
}

/**
 * Start (ms since the epoch) of the stretch of time around `now` in which every
 * discount-code check gives the same answer: the latest startsAt or endsAt of
 * any code or of the campaign at or before `now`, or 0 before the first one.
 * Pricing at this instant equals pricing at `now`, so a client can run a 1 s
 * clock and still only re-price when a code window opens or closes.
 */
export function discountWindowStart(now: Date, config: PricingConfig = defaultPricingConfig): number {
  const at = now.getTime();
  const { discountCodes, campaign } = config.offers;
  const boundaries = [
    ...discountCodes.flatMap((code) => [code.startsAt, code.endsAt]),
    campaign.startsAt,
    campaign.endsAt,
  ];
  let start = 0;
  for (const iso of boundaries) {
    const ms = parseInstant(iso);
    if (ms !== null && ms <= at && ms > start) start = ms;
  }
  return start;
}

/* ------------------------------------------------------------------ */
/* Shipping                                                            */
/* ------------------------------------------------------------------ */

function findCountry(country: CountryCode | undefined, config: PricingConfig): ShippingCountry {
  const { countries, defaultCountry } = config.shipping;
  const match =
    countries.find((candidate) => candidate.code === country) ??
    countries.find((candidate) => candidate.code === defaultCountry) ??
    countries[0];
  if (!match) throw new Error("Shipping config has no countries.");
  return match;
}

/**
 * Shipping for a country (PLAN §7 rule 7). `basis` is the value of the
 * shippable items (sticks, Discovery Set, pouch; no gift cards) after bundle,
 * subscription and free-pouch pricing but before the discount code (D14).
 * Unknown countries fall back to the default country. When nothing needs
 * shipping (gift cards only, or an empty cart) isFree is false and
 * remainingForFree is 0: there is no threshold to work towards.
 */
export function quoteShipping(
  country: CountryCode | undefined,
  basis: number,
  requiresShipping: boolean,
  config: PricingConfig = defaultPricingConfig,
): ShippingQuote {
  const entry = findCountry(country, config);
  const shippableBasis = requiresShipping ? Math.max(0, basis) : 0;
  const isFree = requiresShipping && shippableBasis >= entry.freeFrom;
  return {
    country: entry.code,
    requiresShipping,
    basis: shippableBasis,
    amount: requiresShipping && !isFree ? entry.rate : 0,
    isFree,
    freeFrom: entry.freeFrom,
    remainingForFree: requiresShipping ? Math.max(0, entry.freeFrom - shippableBasis) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

type StickLine = Extract<CartLine, { kind: "stick" }>;

interface Draft {
  line: CartLine;
  priced: PricedLine;
  shippable: boolean;
  discountable: boolean;
  items: number;
}

function isValidStickLine(line: StickLine): boolean {
  if (!Array.isArray(line.scents)) return false;
  if (line.scents.length < 1 || line.scents.length > 3) return false;
  if (!line.scents.every((scent) => typeof scent === "string" && scent.length > 0)) return false;
  const type = line.plan?.type;
  return type === "one-time" || type === "subscription";
}

/**
 * Splits `total` over lines pro rata by their standaloneTotal: Math.floor for
 * all lines but the last, the last gets the remainder (D13). Because bundling
 * is never more expensive than the tiles, no line ends up above its own
 * standaloneTotal; a safety pass moves any rounding excess on the last line
 * back to earlier lines with headroom.
 */
function allocate(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  if (weights.length === 0) return [];
  if (weightSum <= 0) return weights.map((_, index) => (index === weights.length - 1 ? total : 0));

  const shares = weights.map((weight) => Math.floor((total * weight) / weightSum));
  const last = weights.length - 1;
  shares[last] = total - shares.slice(0, last).reduce((sum, share) => sum + share, 0);

  if (total <= weightSum) {
    let excess = shares[last] - weights[last];
    for (let index = 0; excess > 0 && index < last; index += 1) {
      const room = weights[index] - shares[index];
      const moved = Math.min(room, excess);
      shares[index] += moved;
      shares[last] -= moved;
      excess -= moved;
    }
  }
  return shares;
}

/**
 * Prices a cart (PLAN §7 rules 1 to 10).
 *
 * Lines with quantity <= 0, unknown kinds, stick lines without 1 to 3 scents
 * and gift cards with an amount that is not a configured denomination are
 * skipped: they get no entry in `lines` and count nowhere.
 */
export function priceCart(
  input: PriceCartInput,
  config: PricingConfig = defaultPricingConfig,
): PricingSummary {
  const { offers } = config;
  const single = offers.stickPricing[1];
  const pouchPrice = offers.prices.travelPouch;

  const drafts: Draft[] = [];
  for (const line of input.lines) {
    if (!line || !isPositiveInteger(line.quantity)) continue;
    const quantity = line.quantity;
    const base = { lineId: line.id, includesFreePouch: false };

    switch (line.kind) {
      case "stick": {
        if (!isValidStickLine(line)) continue;
        const size = line.scents.length as BundleSize;
        const sticks = size * quantity;
        const standaloneTotal = quantity * bundleUnitPrice(size, purchaseTypeOf(line.plan), config);
        drafts.push({
          line,
          priced: { ...base, stickCount: sticks, listTotal: sticks * single, standaloneTotal, total: standaloneTotal },
          shippable: true,
          discountable: true,
          items: sticks,
        });
        break;
      }
      case "discovery-set": {
        const amount = quantity * offers.prices.discoverySet;
        drafts.push({
          line,
          priced: { ...base, stickCount: 0, listTotal: amount, standaloneTotal: amount, total: amount },
          shippable: true,
          discountable: true,
          items: quantity,
        });
        break;
      }
      case "pouch": {
        const amount = quantity * pouchPrice;
        drafts.push({
          line,
          priced: { ...base, stickCount: 0, listTotal: amount, standaloneTotal: amount, total: amount },
          shippable: true,
          discountable: true,
          items: quantity,
        });
        break;
      }
      case "gift-card": {
        if (!isPositiveInteger(line.amount) || !offers.giftCardDenominations.includes(line.amount)) continue;
        const amount = quantity * line.amount;
        drafts.push({
          line,
          priced: { ...base, stickCount: 0, listTotal: amount, standaloneTotal: amount, total: amount },
          shippable: false,
          discountable: false,
          items: quantity,
        });
        break;
      }
      default:
        // Unknown kind, e.g. from an old or tampered localStorage entry.
        continue;
    }
  }

  // Rules 1 to 4: group sticks per purchase type (intervals pooled, D10),
  // price each group, allocate the group total over its lines (D13).
  const groups: PriceGroup[] = [];
  for (const purchaseType of PURCHASE_TYPES) {
    const members = drafts.filter(
      (draft) => draft.line.kind === "stick" && purchaseTypeOf(draft.line.plan) === purchaseType,
    );
    const stickCount = members.reduce((sum, draft) => sum + draft.priced.stickCount, 0);
    if (stickCount === 0) continue;

    const bundleTotal = stickGroupTotal(stickCount, "one-time", config);
    const total = stickGroupTotal(stickCount, purchaseType, config);
    groups.push({
      purchaseType,
      stickCount,
      bundles: groupSticks(stickCount, purchaseType, config),
      listTotal: stickCount * single,
      bundleTotal,
      subscriptionDiscount: bundleTotal - total,
      total,
    });

    const shares = allocate(
      total,
      members.map((draft) => draft.priced.standaloneTotal),
    );
    members.forEach((draft, index) => {
      draft.priced.total = shares[index];
    });
  }

  const stickCount = groups.reduce((sum, group) => sum + group.stickCount, 0);

  // Rule 5: free Travel Pouch from minSticks sticks, perOrder per order (D11).
  const eligible = stickCount >= offers.freePouch.minSticks;
  const freeCount = eligible ? Math.max(0, offers.freePouch.perOrder) : 0;
  let freeLeft = freeCount;
  let appliedToLineId: string | null = null;
  for (const draft of drafts) {
    if (freeLeft <= 0) break;
    if (draft.line.kind !== "pouch") continue;
    const free = Math.min(freeLeft, draft.line.quantity);
    draft.priced.total -= free * pouchPrice;
    draft.priced.includesFreePouch = true;
    appliedToLineId ??= draft.priced.lineId;
    freeLeft -= free;
  }
  const pouchValue = Math.max(0, offers.freePouch.perOrder) * pouchPrice;
  const pouchSavings = freeCount * pouchPrice;

  // Rule 7 basis: shippable items before the discount code (D14).
  const shippable = drafts.filter((draft) => draft.shippable);
  const basis = shippable.reduce((sum, draft) => sum + draft.priced.total, 0);

  // Rule 6: one percent code per order, never on gift cards.
  let discount: PricingSummary["discount"] = null;
  let discountError: DiscountError | null = null;
  const typedCode = input.discountCode ? normalizeDiscountCode(input.discountCode) : "";
  if (typedCode) {
    const result = validateDiscountCode(typedCode, input.now, config);
    if (!result.valid) {
      discountError = result.error;
    } else {
      const discountable = drafts
        .filter((draft) => draft.discountable)
        .reduce((sum, draft) => sum + draft.priced.total, 0);
      if (discountable <= 0) {
        discountError = "nothing-eligible";
      } else {
        const amount = Math.min(discountable, percentOf(discountable, result.code.value));
        discount = { code: result.code.code, label: result.code.label, amount };
      }
    }
  }

  const lineTotal = drafts.reduce((sum, draft) => sum + draft.priced.total, 0);
  const discountAmount = discount?.amount ?? 0;
  const subtotal = lineTotal - discountAmount;
  const shippingQuote = quoteShipping(input.country, basis, shippable.length > 0, config);

  // Rule 8: savings. Shipping is not a saving.
  const bundleSavings = groups.reduce((sum, group) => sum + group.listTotal - group.bundleTotal, 0);
  const subscriptionSavings = groups.reduce((sum, group) => sum + group.subscriptionDiscount, 0);

  return {
    lines: drafts.map((draft) => draft.priced),
    groups,
    stickCount,
    itemCount: drafts.reduce((sum, draft) => sum + draft.items, 0),
    freePouch: {
      eligible,
      appliedToLineId,
      value: pouchValue,
      sticksNeeded: Math.max(0, offers.freePouch.minSticks - stickCount),
    },
    listTotal: drafts.reduce((sum, draft) => sum + draft.priced.listTotal, 0),
    bundleSavings,
    subscriptionSavings,
    pouchSavings,
    discount,
    discountError,
    subtotal,
    shipping: shippingQuote,
    total: subtotal + shippingQuote.amount,
    totalSavings: bundleSavings + subscriptionSavings + pouchSavings + discountAmount,
  };
}
