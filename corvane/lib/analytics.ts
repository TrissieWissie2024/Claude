import { offers } from "@/content/offers";
import { findProduct, findStick, getFromPrice } from "@/lib/catalog";
import { formatMoneyShort } from "@/lib/money";
import { bundleUnitPrice, purchaseTypeOf } from "@/lib/pricing";
import { readJson, removeStorage, storageKeys, writeJson } from "@/lib/storage";
import type { BundleSize, CartLine, NewCartLine, PricingSummary, Product, PurchasePlan } from "@/lib/types";

/**
 * Analytics events and consent (brief §7, docs/PLAN.md §12).
 *
 * track() only pushes GA4-shaped objects onto window.dataLayer, an in-page
 * array. Nothing leaves the browser from here and no third-party script is
 * ever loaded by this module: components/consent/AnalyticsLoader inserts
 * Google Tag Manager, and only when shouldLoadAnalytics() says so
 * (site.analytics.enabled, a valid site.analytics.gtmId and consent
 * "granted"). Without a tag manager the array just sits in the page.
 * On the server every function is a no-op.
 *
 * Events and where they fire:
 * - view_item: product page mount (useTrackViewItem in components/pdp).
 * - add_to_cart: CartProvider.addLine, with the amount that was really added.
 * - begin_checkout: the Checkout button in the cart drawer (CartSummary).
 * - sign_up: a successful POST /api/subscribe, method "popup" or "newsletter".
 *
 * Payload amounts are integer cents like everywhere else; track() converts
 * them to euros (GA4 expects currency units).
 *
 * Consent: the visitor's choice lives in localStorage (storageKeys.consent);
 * components/consent/ConsentBanner asks for it. Consent Mode commands
 * (initConsentMode, syncConsentMode) go onto the same dataLayer, so a tag
 * manager that loads later sees them in order.
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
  /**
   * Sticks: set size and plan, e.g. "single:one-time" or "set-of-3:subscription-2m".
   * Gift cards: the amount, e.g. "€50". Not set for the Discovery Set and the pouch.
   */
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

/** item_variant of a stick set: "single:one-time", "set-of-3:subscription-2m". */
function stickVariant(size: BundleSize, plan: PurchasePlan): string {
  return [
    size === 1 ? "single" : `set-of-${size}`,
    plan.type === "subscription" ? `subscription-${plan.intervalMonths}m` : "one-time",
  ].join(":");
}

/** item_variant of a gift card: its amount, "€50" (whole euros, like the tiles). */
function giftCardVariant(amount: number): string {
  return formatMoneyShort(amount);
}

/**
 * Payload for view_item on a product page. `price` defaults to the card
 * ("From") price: one stick bought once, or the first gift card amount.
 */
export function getProductAnalytics(product: Product, price: number = getFromPrice(product)): EcommercePayload {
  let variant: string | undefined;
  if (product.kind === "stick" && price === offers.stickPricing[1]) variant = stickVariant(1, { type: "one-time" });
  if (product.kind === "gift-card") variant = giftCardVariant(price);
  return {
    value: price,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_brand: BRAND,
        item_category: product.kind,
        ...(product.kind === "stick" ? { item_category2: product.family } : {}),
        ...(variant ? { item_variant: variant } : {}),
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
      const variant = stickVariant(size, line.plan);
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
            item_variant: giftCardVariant(line.amount),
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

/**
 * Consent as a component sees it: `undefined` until the browser has read
 * storage (server render and hydration), `null` while the visitor has not
 * chosen, otherwise the choice.
 */
export type ConsentSnapshot = ConsentValue | null | undefined;

interface StoredConsent {
  value: ConsentValue;
  /** ISO timestamp of the choice. */
  updatedAt: string;
}

type ConsentListener = (value: ConsentValue | null) => void;

const consentListeners = new Set<ConsentListener>();

/**
 * A choice that storage could not keep (private mode, blocked storage). It
 * holds for the rest of this page session, so the banner does not stay open
 * after a click; the next full page load asks again.
 */
let unsavedConsent: ConsentValue | null = null;

function isConsentValue(value: unknown): value is ConsentValue {
  return value === "granted" || value === "denied";
}

/** The stored analytics consent, or null when the visitor has not chosen. */
export function getConsent(): ConsentValue | null {
  const stored = readJson<unknown>(storageKeys.consent);
  if (isConsentValue(stored)) return stored;
  if (typeof stored === "object" && stored !== null && isConsentValue((stored as StoredConsent).value)) {
    return (stored as StoredConsent).value;
  }
  return unsavedConsent;
}

/** Server snapshot for useSyncExternalStore: storage is unknown before hydration. */
export function getServerConsent(): ConsentSnapshot {
  return undefined;
}

function notifyConsent(): void {
  const value = getConsent();
  consentListeners.forEach((listener) => listener(value));
}

/** Stores the visitor's choice and notifies subscribers. Call from an event handler. */
export function setConsent(value: ConsentValue): void {
  if (!isBrowser() || !isConsentValue(value)) return;
  const record: StoredConsent = { value, updatedAt: new Date().toISOString() };
  unsavedConsent = writeJson(storageKeys.consent, record) ? null : value;
  notifyConsent();
}

/** Forgets the choice (the banner asks again) and notifies subscribers. */
export function resetConsent(): void {
  if (!isBrowser()) return;
  removeStorage(storageKeys.consent);
  unsavedConsent = null;
  notifyConsent();
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key === storageKeys.consent) notifyConsent();
}

/**
 * Calls `listener` whenever consent changes, in this tab or another one.
 * Returns an unsubscribe function. Fits useSyncExternalStore directly:
 * useSyncExternalStore<ConsentSnapshot>(subscribeConsent, getConsent, getServerConsent).
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

/* ------------------------------------------------------------------ */
/* Decisions (pure)                                                    */
/* ------------------------------------------------------------------ */

/** A Google Tag Manager container id: "GTM-" and 4 to 12 upper-case letters or digits. */
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/;

/** True for a well-formed container id. Anything else never reaches a script URL. */
export function isValidGtmId(id: string): boolean {
  return GTM_ID.test(id);
}

export interface AnalyticsLoadInput {
  /** site.analytics.enabled */
  enabled: boolean;
  /** site.analytics.gtmId */
  gtmId: string;
  consent: ConsentSnapshot;
}

/**
 * Whether the tag manager may load: analytics switched on, a valid
 * container id and an explicit "granted". Unknown (undefined), no choice
 * (null) and "denied" all mean no.
 */
export function shouldLoadAnalytics({ enabled, gtmId, consent }: AnalyticsLoadInput): boolean {
  return enabled === true && isValidGtmId(gtmId) && consent === "granted";
}

export interface ConsentBannerInput {
  /** site.analytics.enabled */
  enabled: boolean;
  consent: ConsentSnapshot;
  /** The visitor asked for it again ("Cookie settings" in the footer). */
  reopened: boolean;
}

/**
 * Whether the consent banner shows: only with analytics switched on, never
 * before storage was read (no flash for visitors who already chose), then
 * while there is no choice or after "Cookie settings".
 */
export function shouldShowConsentBanner({ enabled, consent, reopened }: ConsentBannerInput): boolean {
  if (!enabled || consent === undefined) return false;
  return consent === null || reopened;
}

/** The Google Tag Manager script. Only call with an id that passed isValidGtmId(). */
export function gtmScriptUrl(id: string): string {
  return `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
}

/* ------------------------------------------------------------------ */
/* Consent Mode and tag manager start                                  */
/* ------------------------------------------------------------------ */

/*
 * Called by components/consent/AnalyticsLoader, only when analytics is
 * switched on with a valid container id. All of it is pushes onto the local
 * dataLayer; nothing is sent until the tag manager script itself loads.
 */

const consentMode: { initialized: boolean; analytics: ConsentValue; started: boolean } = {
  initialized: false,
  analytics: "denied",
  started: false,
};

/**
 * Google's gtag() helper. Consent Mode commands only count as an Arguments
 * object (not an array), exactly like the official snippet pushes them.
 */
const gtag: (...args: unknown[]) => void = function gtag() {
  try {
    // eslint-disable-next-line prefer-rest-params
    (window.dataLayer ??= []).push(arguments);
  } catch {
    // Analytics must never break the shop.
  }
};

/**
 * Consent Mode defaults, once per page: everything denied. The shop never
 * asks for advertising consent, so the ad_* signals stay denied for good.
 */
export function initConsentMode(): void {
  if (!isBrowser() || consentMode.initialized) return;
  consentMode.initialized = true;
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

/**
 * Brings analytics_storage in line with the visitor's choice (no choice
 * counts as denied). Pushes an update only when the state changes. When
 * consent is withdrawn after it was granted, the Google Analytics cookies
 * are removed as well.
 */
export function syncConsentMode(consent: ConsentValue | null): void {
  if (!isBrowser()) return;
  initConsentMode();
  const next: ConsentValue = consent === "granted" ? "granted" : "denied";
  if (next === consentMode.analytics) return;
  consentMode.analytics = next;
  gtag("consent", "update", { analytics_storage: next });
  if (next === "denied") clearAnalyticsCookies();
}

/**
 * The "gtm.js" start event the tag manager expects before its script runs.
 * Once per page; call right before the script is inserted.
 */
export function startTagManager(): void {
  if (!isBrowser() || consentMode.started) return;
  consentMode.started = true;
  try {
    (window.dataLayer ??= []).push({ "gtm.start": Date.now(), event: "gtm.js" });
  } catch {
    // Analytics must never break the shop.
  }
}

/** First-party cookies Google Analytics sets: _ga, _ga_<id>, _gid, _gat, _gat_<id>. */
const ANALYTICS_COOKIE = /^(_ga|_gid|_gat)(_|$)/;

/**
 * Expires the Google Analytics cookies on this host and its parent domains.
 * The shop itself sets no cookies (Cookie Policy), so this only touches what
 * a tag manager left behind.
 */
export function clearAnalyticsCookies(): void {
  if (!isBrowser()) return;
  try {
    const labels = window.location.hostname.split(".");
    const domains = [""];
    for (let index = 0; index < labels.length - 1; index += 1) {
      domains.push(`; domain=.${labels.slice(index).join(".")}`);
    }
    for (const entry of document.cookie.split(";")) {
      const name = entry.split("=")[0]?.trim() ?? "";
      if (!ANALYTICS_COOKIE.test(name)) continue;
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  } catch {
    // Cookies can be blocked; there is nothing to clear then.
  }
}
