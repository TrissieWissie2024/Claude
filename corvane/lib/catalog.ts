import { offers as defaultOffers } from "@/content/offers";
import type {
  CartLine,
  OffersConfig,
  Product,
  PurchasePlan,
  ScentFamily,
  StickProduct,
  SubscriptionInterval,
} from "@/lib/types";

/**
 * Pure helpers on a product list (docs/PLAN.md §11). Nothing here imports
 * content/products.ts: callers pass the list in. Server components get it from
 * `commerce` (lib/commerce), client components from useCatalog()
 * (components/catalog/CatalogProvider) or props. Prices come from
 * content/offers.ts only.
 */

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

/** Sort options in display order. The first one is the default. */
export const SORT_KEYS: readonly SortKey[] = ["featured", "price-asc", "price-desc", "newest"];

/** Scent families in brief order (§4). */
export const SCENT_FAMILIES: readonly ScentFamily[] = ["Fresh", "Woody", "Dark", "Green", "Citrus", "Aromatic"];

/** Upper bound for the quantity of one cart line. */
export const MAX_LINE_QUANTITY = 99;

/** Upper bound for the number of lines in one cart. */
export const MAX_CART_LINES = 50;

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function isStick(product: Product): product is StickProduct {
  return product.kind === "stick";
}

/** The product with this slug, or null. */
export function findProduct(products: readonly Product[], slug: string): Product | null {
  return products.find((product) => product.slug === slug) ?? null;
}

/** The scent stick with this slug, or null (also null for non-stick products). */
export function findStick(products: readonly Product[], slug: string): StickProduct | null {
  const product = findProduct(products, slug);
  return product && isStick(product) ? product : null;
}

/** All scent sticks, in list order. */
export function getSticks(products: readonly Product[]): StickProduct[] {
  return products.filter(isStick);
}

/** Families that occur in the list, in SCENT_FAMILIES order. */
export function getFamilies(products: readonly Product[]): ScentFamily[] {
  const present = new Set(getSticks(products).map((stick) => stick.family));
  return SCENT_FAMILIES.filter((family) => present.has(family));
}

/** The three notes shown on a product card: first top, first heart, first base. */
export function getCardNotes(stick: StickProduct): string[] {
  return [stick.notes.top[0], stick.notes.heart[0], stick.notes.base[0]].filter(
    (note): note is string => typeof note === "string" && note.length > 0,
  );
}

/* ------------------------------------------------------------------ */
/* Prices                                                              */
/* ------------------------------------------------------------------ */

/**
 * Lowest price a product can be bought for, in cents, one-time: a single stick
 * (offers.stickPricing[1]), the Discovery Set or pouch price, or the lowest
 * gift card denomination. Bundle prices per stick are a PDP concern
 * (getBundleTileQuote in lib/pricing.ts).
 */
export function getFromPrice(product: Product, offers: OffersConfig = defaultOffers): number {
  switch (product.kind) {
    case "stick":
      return offers.stickPricing[1];
    case "discovery-set":
      return offers.prices.discoverySet;
    case "pouch":
      return offers.prices.travelPouch;
    case "gift-card":
      return offers.giftCardDenominations.length > 0 ? Math.min(...offers.giftCardDenominations) : 0;
  }
}

/** True when the card price is a "From" price (gift cards with several amounts). */
export function hasFromPrice(product: Product, offers: OffersConfig = defaultOffers): boolean {
  return product.kind === "gift-card" && offers.giftCardDenominations.length > 1;
}

/* ------------------------------------------------------------------ */
/* Sorting and filtering                                               */
/* ------------------------------------------------------------------ */

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && (SORT_KEYS as readonly string[]).includes(value);
}

/** Reads a sort key from a search param; anything unknown becomes "featured". */
export function parseSortKey(value: string | null | undefined): SortKey {
  return isSortKey(value) ? value : "featured";
}

/** Reads a family from a search param (case-insensitive); anything unknown becomes null. */
export function parseFamily(value: string | null | undefined): ScentFamily | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  return SCENT_FAMILIES.find((family) => family.toLowerCase() === wanted) ?? null;
}

function byFeatured(a: Product, b: Product): number {
  return a.featuredRank - b.featuredRank || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
}

/**
 * Sorted copy of the list. Ties (same price, same release date) fall back to
 * featuredRank. The input is never mutated.
 */
export function sortProducts(
  list: readonly Product[],
  sort: SortKey,
  offers: OffersConfig = defaultOffers,
): Product[] {
  const sorted = [...list];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => getFromPrice(a, offers) - getFromPrice(b, offers) || byFeatured(a, b));
    case "price-desc":
      return sorted.sort((a, b) => getFromPrice(b, offers) - getFromPrice(a, offers) || byFeatured(a, b));
    case "newest":
      return sorted.sort(
        (a, b) => (a.releasedAt < b.releasedAt ? 1 : a.releasedAt > b.releasedAt ? -1 : 0) || byFeatured(a, b),
      );
    case "featured":
    default:
      return sorted.sort(byFeatured);
  }
}

/**
 * No family: the whole list (copy). A family: only the sticks of that family
 * (the Discovery Set, pouch and gift card have no family).
 */
export function filterByFamily(list: readonly Product[], family: ScentFamily | null): Product[] {
  if (family === null) return [...list];
  return list.filter((product) => isStick(product) && product.family === family);
}

/* ------------------------------------------------------------------ */
/* Cart line validation                                                */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_LINE_QUANTITY;
}

function parsePlan(value: unknown, offers: OffersConfig): PurchasePlan | null {
  if (!isRecord(value)) return null;
  if (value.type === "one-time") return { type: "one-time" };
  if (value.type === "subscription") {
    const interval = value.intervalMonths;
    if (typeof interval === "number" && (offers.subscription.intervalsMonths as number[]).includes(interval)) {
      return { type: "subscription", intervalMonths: interval as SubscriptionInterval };
    }
  }
  return null;
}

/**
 * Validates one untrusted cart line (localStorage, a request body) against the
 * catalog and the offers. Returns a clean copy with only known fields, or null.
 * Stick scents must be 1 to 3 stick slugs from `products`; the other kinds need
 * their product in `products`; gift card amounts must be a configured
 * denomination. The id is kept as given; callers that merge lines re-derive it
 * with cartLineId() from lib/pricing.ts.
 */
export function parseCartLine(
  value: unknown,
  products: readonly Product[],
  offers: OffersConfig = defaultOffers,
): CartLine | null {
  if (!isRecord(value)) return null;
  const { id, kind, quantity } = value;
  if (typeof id !== "string" || id.length === 0 || id.length > 200) return null;
  if (!isQuantity(quantity)) return null;

  switch (kind) {
    case "stick": {
      const scents = value.scents;
      if (!Array.isArray(scents) || scents.length < 1 || scents.length > 3) return null;
      if (!scents.every((slug) => typeof slug === "string" && findStick(products, slug) !== null)) return null;
      const plan = parsePlan(value.plan, offers);
      if (!plan) return null;
      return { id, kind: "stick", scents: [...(scents as string[])], plan, quantity };
    }
    case "discovery-set":
      if (value.slug !== "discovery-set" || findProduct(products, "discovery-set")?.kind !== "discovery-set") return null;
      return { id, kind: "discovery-set", slug: "discovery-set", quantity };
    case "pouch":
      if (value.slug !== "travel-pouch" || findProduct(products, "travel-pouch")?.kind !== "pouch") return null;
      return { id, kind: "pouch", slug: "travel-pouch", quantity };
    case "gift-card": {
      const amount = value.amount;
      if (value.slug !== "e-gift-card" || findProduct(products, "e-gift-card")?.kind !== "gift-card") return null;
      if (typeof amount !== "number" || !offers.giftCardDenominations.includes(amount)) return null;
      return { id, kind: "gift-card", slug: "e-gift-card", amount, quantity };
    }
    default:
      return null;
  }
}

/** Validates a list of untrusted lines: drops malformed ones, keeps at most MAX_CART_LINES. */
export function parseCartLines(
  value: unknown,
  products: readonly Product[],
  offers: OffersConfig = defaultOffers,
): CartLine[] {
  if (!Array.isArray(value)) return [];
  const lines: CartLine[] = [];
  for (const candidate of value) {
    const line = parseCartLine(candidate, products, offers);
    if (line) lines.push(line);
    if (lines.length >= MAX_CART_LINES) break;
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Display names                                                       */
/* ------------------------------------------------------------------ */

/** Scent names for a stick line, in the order chosen; unknown slugs fall back to the slug. */
export function getScentNames(products: readonly Product[], scents: readonly string[]): string[] {
  return scents.map((slug) => findStick(products, slug)?.name ?? slug);
}
