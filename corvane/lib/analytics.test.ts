import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { products } from "@/content/products";
import {
  getCartAnalytics,
  getLineAnalytics,
  getProductAnalytics,
  gtmScriptUrl,
  isValidGtmId,
  shouldLoadAnalytics,
  shouldShowConsentBanner,
  type ConsentSnapshot,
} from "@/lib/analytics";
import { findProduct } from "@/lib/catalog";
import { priceCart } from "@/lib/pricing";
import { storageKeys } from "@/lib/storage";
import type { CartLine } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* A minimal browser: window.dataLayer, localStorage, document.cookie  */
/* ------------------------------------------------------------------ */

interface FakeBrowser {
  window: { dataLayer?: unknown[]; localStorage: Storage; location: { hostname: string } } & Partial<EventTarget>;
  store: Map<string, string>;
  cookies: Map<string, string>;
  /** Raw `document.cookie = ...` writes, in order. */
  cookieWrites: string[];
}

function fakeStorage(store: Map<string, string>, failWrites: boolean): Storage {
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => {
      if (failWrites) throw new Error("QuotaExceededError");
      store.set(key, String(value));
    },
  };
}

function installBrowser({ failWrites = false, hostname = "shop.corvane.example" } = {}): FakeBrowser {
  const store = new Map<string, string>();
  const cookies = new Map<string, string>();
  const cookieWrites: string[] = [];
  const target = new EventTarget();
  const win = {
    localStorage: fakeStorage(store, failWrites),
    location: { hostname },
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", {
    get cookie() {
      return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    set cookie(raw: string) {
      cookieWrites.push(raw);
      const [pair] = raw.split(";");
      const [name, value = ""] = pair.split("=");
      if (/expires=Thu, 01 Jan 1970/.test(raw)) cookies.delete(name.trim());
      else cookies.set(name.trim(), value);
    },
  });
  return { window: win, store, cookies, cookieWrites };
}

/** A fresh copy of lib/analytics (its consent and Consent Mode state are per page). */
async function freshAnalytics() {
  vi.resetModules();
  return import("@/lib/analytics");
}

function isArguments(value: unknown): value is IArguments {
  return Object.prototype.toString.call(value) === "[object Arguments]";
}

/** dataLayer entries with gtag() Arguments objects turned into arrays, for readable assertions. */
function readable(dataLayer: unknown[] | undefined): unknown[] {
  return (dataLayer ?? []).map((entry) => (isArguments(entry) ? Array.from(entry) : entry));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
/* Decisions                                                           */
/* ------------------------------------------------------------------ */

describe("shouldLoadAnalytics", () => {
  const consents: ConsentSnapshot[] = [undefined, null, "denied", "granted"];

  it("loads only with analytics on, a valid container id and consent granted", () => {
    for (const enabled of [false, true]) {
      for (const gtmId of ["", "GTM-TEST000", "G-ABC123", "GTM-test000"]) {
        for (const consent of consents) {
          const expected = enabled && gtmId === "GTM-TEST000" && consent === "granted";
          expect(shouldLoadAnalytics({ enabled, gtmId, consent }), `${enabled} ${gtmId} ${consent}`).toBe(expected);
        }
      }
    }
  });

  it("is off with the default config (no env vars)", async () => {
    const { site } = await import("@/content/site");
    expect(site.analytics.enabled).toBe(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true");
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === undefined) {
      expect(site.analytics.enabled).toBe(false);
      expect(shouldLoadAnalytics({ ...site.analytics, consent: "granted" })).toBe(false);
    }
  });
});

describe("isValidGtmId and gtmScriptUrl", () => {
  it("accepts real container ids only", () => {
    expect(isValidGtmId("GTM-TEST000")).toBe(true);
    expect(isValidGtmId("GTM-5XK2PQ7")).toBe(true);
    for (const id of ["", "GTM-", "GTM-ABC", "gtm-TEST000", "G-TEST000", "GTM-TEST000\"", "GTM-TEST000&l=x", " GTM-TEST000"]) {
      expect(isValidGtmId(id), id).toBe(false);
    }
  });

  it("builds the tag manager URL", () => {
    expect(gtmScriptUrl("GTM-TEST000")).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-TEST000");
  });
});

describe("shouldShowConsentBanner", () => {
  it("never shows with analytics off", () => {
    for (const consent of [undefined, null, "denied", "granted"] as ConsentSnapshot[]) {
      for (const reopened of [false, true]) {
        expect(shouldShowConsentBanner({ enabled: false, consent, reopened })).toBe(false);
      }
    }
  });

  it("waits for storage to be read (no flash during hydration)", () => {
    expect(shouldShowConsentBanner({ enabled: true, consent: undefined, reopened: false })).toBe(false);
    expect(shouldShowConsentBanner({ enabled: true, consent: undefined, reopened: true })).toBe(false);
  });

  it("asks when there is no choice, and again only when reopened", () => {
    expect(shouldShowConsentBanner({ enabled: true, consent: null, reopened: false })).toBe(true);
    expect(shouldShowConsentBanner({ enabled: true, consent: "granted", reopened: false })).toBe(false);
    expect(shouldShowConsentBanner({ enabled: true, consent: "denied", reopened: false })).toBe(false);
    expect(shouldShowConsentBanner({ enabled: true, consent: "granted", reopened: true })).toBe(true);
    expect(shouldShowConsentBanner({ enabled: true, consent: "denied", reopened: true })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Consent storage                                                     */
/* ------------------------------------------------------------------ */

describe("consent storage", () => {
  beforeEach(() => {
    vi.stubGlobal("StorageEvent", class extends Event {});
  });

  it("is null without a choice and on the server", async () => {
    const analytics = await freshAnalytics();
    expect(analytics.getConsent()).toBeNull();
    expect(analytics.getServerConsent()).toBeUndefined();
    installBrowser();
    expect(analytics.getConsent()).toBeNull();
  });

  it("stores the choice with a timestamp and notifies subscribers", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    const seen: unknown[] = [];
    const unsubscribe = analytics.subscribeConsent((value) => seen.push(value));

    analytics.setConsent("granted");
    expect(analytics.getConsent()).toBe("granted");
    const stored = JSON.parse(browser.store.get(storageKeys.consent) ?? "null") as { value: string; updatedAt: string };
    expect(stored.value).toBe("granted");
    expect(Number.isNaN(Date.parse(stored.updatedAt))).toBe(false);

    analytics.setConsent("denied");
    analytics.resetConsent();
    expect(analytics.getConsent()).toBeNull();
    expect(seen).toEqual(["granted", "denied", null]);

    unsubscribe();
    analytics.setConsent("granted");
    expect(seen).toHaveLength(3);
  });

  it("reads a bare stored value and ignores junk", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    browser.store.set(storageKeys.consent, JSON.stringify("denied"));
    expect(analytics.getConsent()).toBe("denied");
    browser.store.set(storageKeys.consent, "{not json");
    expect(analytics.getConsent()).toBeNull();
    browser.store.set(storageKeys.consent, JSON.stringify({ value: "maybe" }));
    expect(analytics.getConsent()).toBeNull();
  });

  it("keeps a choice in memory when storage refuses it, so the banner can close", async () => {
    const browser = installBrowser({ failWrites: true });
    const analytics = await freshAnalytics();
    analytics.setConsent("denied");
    expect(browser.store.size).toBe(0);
    expect(analytics.getConsent()).toBe("denied");
    analytics.resetConsent();
    expect(analytics.getConsent()).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* dataLayer                                                           */
/* ------------------------------------------------------------------ */

describe("track", () => {
  it("is a no-op on the server", async () => {
    const analytics = await freshAnalytics();
    expect(() => analytics.track("sign_up", { method: "newsletter" })).not.toThrow();
  });

  it("pushes GA4 ecommerce events in euros, each after { ecommerce: null }", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    analytics.track(
      "add_to_cart",
      analytics.getLineAnalytics(
        { kind: "stick", scents: ["north-swell", "dune-fig"], plan: { type: "subscription", intervalMonths: 2 }, quantity: 1 },
        products,
      ),
    );
    analytics.track("sign_up", { method: "popup" });

    const [clear, event, signUp] = browser.window.dataLayer ?? [];
    expect(clear).toEqual({ ecommerce: null });
    expect(event).toMatchObject({
      event: "add_to_cart",
      ecommerce: {
        currency: "EUR",
        value: 38.21,
        items: [
          { item_id: "north-swell", item_variant: "set-of-2:subscription-2m", price: 19.11, quantity: 1 },
          { item_id: "dune-fig", item_variant: "set-of-2:subscription-2m", price: 19.11, quantity: 1 },
        ],
      },
    });
    expect(signUp).toEqual({ event: "sign_up", method: "popup" });
    expect(browser.window.dataLayer).toHaveLength(3);
  });

  it("sends whole cents as euros with at most two decimals", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    analytics.track("view_item", analytics.getProductAnalytics(findProduct(products, "north-swell")!));
    const event = (browser.window.dataLayer ?? [])[1] as { ecommerce: { value: number; items: { price: number }[] } };
    for (const amount of [event.ecommerce.value, event.ecommerce.items[0].price]) {
      expect(Math.round(amount * 100) / 100).toBe(amount);
    }
  });
});

describe("payload builders", () => {
  it("describes a stick for view_item as one stick bought once", () => {
    const payload = getProductAnalytics(findProduct(products, "north-swell")!);
    expect(payload.value).toBe(2495);
    expect(payload.items).toEqual([
      expect.objectContaining({ item_id: "north-swell", item_variant: "single:one-time", price: 2495, quantity: 1 }),
    ]);
  });

  it("names the gift card amount as the variant", () => {
    const view = getProductAnalytics(findProduct(products, "e-gift-card")!);
    expect(view.items[0].item_variant).toBe("€25");
    const line = getLineAnalytics({ kind: "gift-card", slug: "e-gift-card", amount: 5000, quantity: 2 }, products);
    expect(line.value).toBe(10000);
    expect(line.items[0]).toMatchObject({ item_variant: "€50", price: 5000, quantity: 2 });
  });

  it("leaves the variant out for the Discovery Set and the pouch", () => {
    for (const slug of ["discovery-set", "travel-pouch"]) {
      expect(getProductAnalytics(findProduct(products, slug)!).items[0].item_variant).toBeUndefined();
    }
  });

  it("values begin_checkout at the cart subtotal, with the code as coupon", () => {
    const lines: CartLine[] = [
      { id: "a", kind: "stick", scents: ["north-swell", "dune-fig", "iron-coast"], plan: { type: "one-time" }, quantity: 1 },
      { id: "b", kind: "pouch", slug: "travel-pouch", quantity: 1 },
    ];
    const summary = priceCart({ lines, discountCode: "WELCOME10", now: new Date("2026-10-26T12:00:00+01:00") });
    const payload = getCartAnalytics(lines, products, summary);
    expect(payload.value).toBe(summary.subtotal);
    expect(payload.coupon).toBe("WELCOME10");
    expect(payload.items.map((item) => item.item_id)).toEqual(["north-swell", "dune-fig", "iron-coast", "travel-pouch"]);
  });
});

/* ------------------------------------------------------------------ */
/* Consent Mode and tag manager start                                  */
/* ------------------------------------------------------------------ */

describe("Consent Mode", () => {
  const defaults = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  };

  it("pushes the defaults once, as gtag() Arguments objects", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    analytics.initConsentMode();
    analytics.initConsentMode();
    expect(browser.window.dataLayer).toHaveLength(1);
    expect(isArguments(browser.window.dataLayer?.[0])).toBe(true);
    expect(readable(browser.window.dataLayer)).toEqual([["consent", "default", defaults]]);
  });

  it("updates analytics_storage only when the choice changes, then starts GTM once", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    analytics.syncConsentMode(null);
    analytics.syncConsentMode("denied");
    analytics.syncConsentMode("granted");
    analytics.syncConsentMode("granted");
    analytics.startTagManager();
    analytics.startTagManager();

    const entries = readable(browser.window.dataLayer);
    expect(entries.slice(0, 2)).toEqual([
      ["consent", "default", defaults],
      ["consent", "update", { analytics_storage: "granted" }],
    ]);
    expect(entries[2]).toMatchObject({ event: "gtm.js" });
    expect(typeof (entries[2] as Record<string, unknown>)["gtm.start"]).toBe("number");
    expect(entries).toHaveLength(3);
  });

  it("withdrawing consent pushes denied and clears the Google Analytics cookies", async () => {
    const browser = installBrowser();
    const analytics = await freshAnalytics();
    browser.cookies.set("_ga", "GA1.1.1");
    browser.cookies.set("_ga_ABC123", "GS1.1");
    browser.cookies.set("_gid", "GA1.1.2");
    browser.cookies.set("gallery", "keep");
    analytics.syncConsentMode("granted");
    analytics.syncConsentMode("denied");

    expect(readable(browser.window.dataLayer).at(-1)).toEqual(["consent", "update", { analytics_storage: "denied" }]);
    expect([...browser.cookies.keys()]).toEqual(["gallery"]);
    // The host and each parent domain, so a cookie set on .corvane.example goes too.
    expect(browser.cookieWrites.filter((raw) => raw.startsWith("_ga="))).toEqual([
      "_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/",
      "_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.shop.corvane.example",
      "_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.corvane.example",
    ]);
  });

  it("does nothing on the server", async () => {
    const analytics = await freshAnalytics();
    expect(() => {
      analytics.initConsentMode();
      analytics.syncConsentMode("granted");
      analytics.startTagManager();
      analytics.clearAnalyticsCookies();
    }).not.toThrow();
  });
});
