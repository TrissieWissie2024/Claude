import { offers } from "@/content/offers";
import { findProduct, findStick, getFromPrice } from "@/lib/catalog";
import { bundleUnitPrice, purchaseTypeOf } from "@/lib/pricing";
import { readJson, removeStorage, storageKeys, writeJson } from "@/lib/storage";
import type { BundleSize, CartLine, NewCartLine, PricingSummary, Product } from "@/lib/types";

/**
 * Analytics events and consent (brief §7, docs/PLAN.md §12).
 *
 * track() only pushes GA4-shaped objects onto window.dataLayer, an in-page
 * array. Nothing leaves the browser from here and no third-party script is
 * ever loaded by this module: components/consent/AnalyticsLoader loads a tag
 * manager later, and only when site.analytics.enabled is true and consent is
 * "granted". On the server every function is a no-op.
 *
 * Payload amounts are integer cents like everywhere else; track() converts
 * them to euros (GA4 expects currency units).
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/* ------------------------------------------------------------------ */
/* Event types                                                         */
/* ------------------------------------------------------------------ */

export interface AnalyticsItem {
  /** Product slug. */
  item_id: string;
  item_name: string;
  item_brand?: string;
  /** Product kind: "stick", "discovery-set", "pouch" or "gift-card". */
  item_category?: string;
  /** Scent family for sticks. */
  item_category2?: string;
  /** e.g. "single", "set-of-3", "subscription-2m", "5000". */
  item_variant?: string;
  /** Unit price in cents. */
  price: number;
  quantity: number;
}

export interface EcommercePayload {
  /** Event value in cents. */
  value: number;
  items: AnalyticsItem[];
  coupon?: string;
}

export interface SignUpPayload {
  /** Where the sign-up happened, e.g. "email_capture" or "newsletter". */
  method: string;
}

export interface AnalyticsEventMap {
  view_item: EcommercePayload;
  add_to_cart: EcommercePayload;
  begin_checkout: EcommercePayload;
  sign_up: SignUpPayload;
}

export type AnalyticsEvent = keyof AnalyticsEventMap;

function toEuros(cents: number): number {
  return Math.round(cents) / 100;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Pushes one event onto window.dataLayer (created when missing).
 * Ecommerce events: { event, ecommerce: { currency: "EUR", value, coupon?, items } },
 * preceded by { ecommerce: null } to clear the previous ecommerce object (GA4 guidance).
 * sign_up: { event: "sign_up", method }.
 */
export function track<E extends AnalyticsEvent>(event: E, payload: AnalyticsEventMap[E]): void {
  if (!isBrowser()) return;
  try {
    const dataLayer = (window.dataLayer ??= []);
    if (event === "sign_up") {
      dataLayer.push({ event, method: (payload as SignUpPayload).method });
      return;
    }
    const { value, items, coupon } = payload as EcommercePayload;
    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event,
      ecommerce: {
        currency: offers.currency,
        value: toEuros(value),
        ...(coupon ? { coupon } : {}),
        items: items.map((item) => ({ ...item, price: toEuros(item.price) })),
      },
    });
  } catch {
    // Analytics must never break the shop.
  }
}

/* ------------------------------------------------------------------ */
/* Payload builders                                                    */
/* ------------------------------------------------------------------ */

const BRAND = "CORVANE";

/** Payload for view_item on a product page. `price` defaults to the card ("From") price. */
export function getProductAnalytics(product: Product, price: number = getFromPrice(product)): EcommercePayload {
  return {
    value: price,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_brand: BRAND,
        item_category: product.kind,
        ...(product.kind === "stick" ? { item_category2: product.family } : {}),
        price,
        quantity: 1,
      },
    ],
  };
}

/**
 * Items and value of one cart line at its own (tile) price, before grouping
 * across lines. A stick set becomes one item per scent at the set's price per
 * stick; the value is the exact set price times the quantity.
 */
export function getLineAnalytics(line: CartLine | NewCartLine, products: readonly Product[]): EcommercePayload {
  switch (line.kind) {
    case "stick": {
      const size = Math.min(3, Math.max(1, line.scents.length)) as BundleSize;
      const purchaseType = purchaseTypeOf(line.plan);
      const setPrice = bundleUnitPrice(size, purchaseType);
      const variant = [
        size === 1 ? "single" : `set-of-${size}`,
        line.plan.type === "subscription" ? `subscription-${line.plan.intervalMonths}m` : "one-time",
      ].join(":");
      return {
        value: setPrice * line.quantity,
        items: line.scents.map((slug) => {
          const stick = findStick(products, slug);
          return {
            item_id: slug,
            item_name: stick?.name ?? slug,
            item_brand: BRAND,
            item_category: "stick",
            ...(stick ? { item_category2: stick.family } : {}),
            item_variant: variant,
            price: Math.round(setPrice / size),
            quantity: line.quantity,
          };
        }),
      };
    }
    case "gift-card": {
      const product = findProduct(products, line.slug);
      return {
        value: line.amount * line.quantity,
        items: [
          {
            item_id: line.slug,
            item_name: product?.name ?? line.slug,
            item_brand: BRAND,
            item_category: line.kind,
            item_variant: String(line.amount),
            price: line.amount,
            quantity: line.quantity,
          },
        ],
      };
    }
    case "discovery-set":
    case "pouch": {
      const product = findProduct(products, line.slug);
      const price = line.kind === "pouch" ? offers.prices.travelPouch : offers.prices.discoverySet;
      return {
        value: price * line.quantity,
        items: [
          {
            item_id: line.slug,
            item_name: product?.name ?? line.slug,
            item_brand: BRAND,
            item_category: line.kind,
            price,
            quantity: line.quantity,
          },
        ],
      };
    }
  }
}

/**
 * Payload for begin_checkout. With a pricing summary the value is the
 * subtotal (after bundles, free pouch and code; shipping excluded) and the
 * applied code is sent as coupon.
 */
export function getCartAnalytics(
  lines: readonly CartLine[],
  products: readonly Product[],
  summary?: PricingSummary,
): EcommercePayload {
  const perLine = lines.map((line) => getLineAnalytics(line, products));
  const coupon = summary?.discount?.code;
  return {
    value: summary ? summary.subtotal : perLine.reduce((sum, entry) => sum + entry.value, 0),
    items: perLine.flatMap((entry) => entry.items),
    ...(coupon ? { coupon } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Consent                                                             */
/* ------------------------------------------------------------------ */

export type ConsentValue = "granted" | "denied";

interface StoredConsent {
  value: ConsentValue;
  /** ISO timestamp of the choice. */
  updatedAt: string;
}

type ConsentListener = (value: ConsentValue | null) => void;

const consentListeners = new Set<ConsentListener>();

function isConsentValue(value: unknown): value is ConsentValue {
  return value === "granted" || value === "denied";
}

/** The stored analytics consent, or null when the visitor has not chosen (or storage is unavailable). */
export function getConsent(): ConsentValue | null {
  const stored = readJson<unknown>(storageKeys.consent);
  if (isConsentValue(stored)) return stored;
  if (typeof stored === "object" && stored !== null && isConsentValue((stored as StoredConsent).value)) {
    return (stored as StoredConsent).value;
  }
  return null;
}

function notifyConsent(): void {
  const value = getConsent();
  consentListeners.forEach((listener) => listener(value));
}

/** Stores the visitor's choice and notifies subscribers. Call from an event handler. */
export function setConsent(value: ConsentValue): void {
  if (!isBrowser() || !isConsentValue(value)) return;
  const record: StoredConsent = { value, updatedAt: new Date().toISOString() };
  writeJson(storageKeys.consent, record);
  notifyConsent();
}

/** Forgets the choice (the banner asks again) and notifies subscribers. */
export function resetConsent(): void {
  if (!isBrowser()) return;
  removeStorage(storageKeys.consent);
  notifyConsent();
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key === storageKeys.consent) notifyConsent();
}

/**
 * Calls `listener` whenever consent changes, in this tab or another one.
 * Returns an unsubscribe function. Fits useSyncExternalStore directly:
 * useSyncExternalStore(subscribeConsent, getConsent, () => null).
 */
export function subscribeConsent(listener: ConsentListener): () => void {
  if (!isBrowser()) return () => {};
  if (consentListeners.size === 0) window.addEventListener("storage", onStorage);
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
    if (consentListeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}
