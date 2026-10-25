"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useCatalog } from "@/components/catalog/CatalogProvider";
import { cartCopy } from "@/content/cart";
import { shipping } from "@/content/shipping";
import { site } from "@/content/site";
import { getLineAnalytics, track } from "@/lib/analytics";
import { findProduct, getScentNames, MAX_LINE_QUANTITY, parseCartLine, parseCartLines } from "@/lib/catalog";
import { useNow } from "@/lib/hooks/useNow";
import { formatMoneyShort } from "@/lib/money";
import { cartLineId, discountWindowStart, normalizeDiscountCode, priceCart, validateDiscountCode } from "@/lib/pricing";
import { readJson, readStorage, storageKeys, writeJson } from "@/lib/storage";
import type { CartLine, CountryCode, DiscountError, NewCartLine, PricingSummary, Product } from "@/lib/types";

/**
 * Cart state (docs/PLAN.md §11). Lines, discount code and country live in a
 * small external store, persisted with lib/storage.ts:
 * - storageKeys.cart    { v: 1, lines, discountCode }
 * - storageKeys.country "NL" | "BE" (kept separately, so clearing the cart keeps the country)
 *
 * Storage is read after mount (never during render or prerender), validated
 * defensively (malformed or unknown lines are dropped) and synced across tabs.
 * Without storage the cart works in memory.
 *
 * Must be rendered inside <CatalogProvider>, which supplies the products.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface AddLineOptions {
  /** Open the cart drawer after adding. Default true. */
  open?: boolean;
}

/** `{ ok: boolean; error?: DiscountError }`, narrowed: error is set exactly when ok is false. */
export type ApplyDiscountResult = { ok: true; error?: undefined } | { ok: false; error: DiscountError };

export interface CartContextValue {
  lines: CartLine[];
  /** Normalised (trimmed, upper case) code, or null. Kept even when it stops being valid; see pricing.discountError. */
  discountCode: string | null;
  country: CountryCode;
  /**
   * Re-priced within a second of a code window opening or closing. A checkout
   * handler should still re-check the code with validateDiscountCode(code, new Date()).
   */
  pricing: PricingSummary;
  /** Number of items; every stick counts one. 0 until hydrated. */
  itemCount: number;
  /** False on the server and during hydration; true once storage and the clock are read. */
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
  /** Adds a line, merged with an existing line for the same set and plan (cartLineId). Fires add_to_cart. */
  addLine: (newLine: NewCartLine, options?: AddLineOptions) => void;
  /** Sets the quantity of a line; 0 or less removes it. Capped at MAX_LINE_QUANTITY. */
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  /** Validates the code now and stores it only when valid. */
  applyDiscountCode: (code: string) => ApplyDiscountResult;
  clearDiscountCode: () => void;
  setCountry: (code: CountryCode) => void;
  /** Removes all lines and the code; keeps the country. */
  clear: () => void;
}

interface CartState {
  /** True once storage has been read. */
  loaded: boolean;
  lines: CartLine[];
  discountCode: string | null;
  country: CountryCode;
}

interface StoredCart {
  v: 1;
  lines: CartLine[];
  discountCode: string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Clock for discount-code windows (LAUNCH15 ends at a fixed time). The same 1 s
 * clock as the promo bar, so the code stops working in the same tick as the
 * bar disappears (docs/PLAN.md §8). The cart only re-prices when a code window
 * opens or closes (discountWindowStart), not on every tick.
 */
const PRICING_CLOCK_MS = 1000;

/** Used for pricing before the clock runs; there are no lines then anyway. */
const EPOCH = new Date(0);

const MAX_CODE_LENGTH = 64;

const INITIAL_STATE: CartState = {
  loaded: false,
  lines: [],
  discountCode: null,
  country: shipping.defaultCountry,
};

function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && shipping.countries.some((country) => country.code === value);
}

function clampQuantity(quantity: number): number {
  return Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.floor(quantity)));
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Each scent once, with its count: ["North Swell", "Dune Fig", "North Swell"] -> ["2 × North Swell", "Dune Fig"]. */
function countScentNames(names: string[]): string[] {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].map(([name, count]) => cartCopy.line.scentCount(name, count));
}

/**
 * Short customer-facing name of a line, e.g. "North Swell",
 * "Set of 3: North Swell, Dune Fig and Iron Coast", "Set of 3: 2 × North Swell and Dune Fig",
 * "E-gift card, €50".
 */
export function getCartLineName(line: CartLine | NewCartLine, products: readonly Product[]): string {
  switch (line.kind) {
    case "stick": {
      const names = joinNames(countScentNames(getScentNames(products, line.scents)));
      return line.scents.length === 1 ? names : cartCopy.line.setWithScents(cartCopy.line.set(line.scents.length), names);
    }
    case "gift-card":
      return cartCopy.line.giftCard(formatMoneyShort(line.amount));
    default:
      return findProduct(products, line.slug)?.name ?? line.slug;
  }
}

/** Re-derives ids and merges lines for the same set and plan. */
function mergeLines(lines: readonly CartLine[]): CartLine[] {
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    const id = cartLineId(line);
    const existing = merged.get(id);
    merged.set(
      id,
      existing
        ? { ...existing, quantity: clampQuantity(existing.quantity + line.quantity) }
        : { ...line, id },
    );
  }
  return [...merged.values()];
}

function normalizeStoredCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = normalizeDiscountCode(value);
  return code && code.length <= MAX_CODE_LENGTH ? code : null;
}

function readStoredState(products: readonly Product[]): CartState {
  const stored = readJson<unknown>(storageKeys.cart);
  const record = typeof stored === "object" && stored !== null ? (stored as Partial<StoredCart>) : null;
  const valid = record?.v === 1;

  // The country may be stored as JSON ("\"NL\"") or as a raw string ("NL").
  const storedCountry = readJson<unknown>(storageKeys.country) ?? readStorage(storageKeys.country);

  return {
    loaded: true,
    lines: valid ? mergeLines(parseCartLines(record.lines, products)) : [],
    discountCode: valid ? normalizeStoredCode(record.discountCode) : null,
    country: isCountryCode(storedCountry) ? storedCountry : shipping.defaultCountry,
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface CartStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => CartState;
  getServerSnapshot: () => CartState;
  /** Applies a change; persists and notifies when the state changed. */
  update: (change: (state: CartState) => CartState) => void;
  getState: () => CartState;
}

function createCartStore(products: readonly Product[]): CartStore {
  let state = INITIAL_STATE;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  const ensureLoaded = () => {
    if (!state.loaded) state = readStoredState(products);
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== storageKeys.cart && event.key !== storageKeys.country) return;
    state = readStoredState(products);
    emit();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) window.addEventListener("storage", onStorage);
      if (!state.loaded) {
        // First subscriber (after mount, in the browser): read storage now.
        ensureLoaded();
        queueMicrotask(emit);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_STATE,
    getState: () => state,
    update(change) {
      ensureLoaded();
      const previous = state;
      const next = change(previous);
      if (next === previous) return;
      state = next;
      if (next.lines !== previous.lines || next.discountCode !== previous.discountCode) {
        const stored: StoredCart = { v: 1, lines: next.lines, discountCode: next.discountCode };
        writeJson(storageKeys.cart, stored);
      }
      if (next.country !== previous.country) writeJson(storageKeys.country, next.country);
      emit();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

const CartContext = createContext<CartContextValue | null>(null);

interface Announcement {
  id: number;
  text: string;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [store] = useState(() => createCartStore(products));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const now = useNow(PRICING_CLOCK_MS);
  const [isOpen, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  const { lines, discountCode, country } = state;
  const hydrated = state.loaded && now !== null;
  // A number, so the memo below only re-runs when a code window opens or closes.
  const pricingAt = now === null ? null : discountWindowStart(now);

  const pricing = useMemo(
    () =>
      priceCart({
        lines,
        // Without a clock a code cannot be checked; leave it out instead of reporting an error.
        discountCode: pricingAt === null ? null : discountCode,
        country,
        now: pricingAt === null ? EPOCH : new Date(pricingAt),
      }),
    [lines, discountCode, country, pricingAt],
  );

  const announce = useCallback((text: string) => {
    setAnnouncement((previous) => ({ id: (previous?.id ?? 0) + 1, text }));
  }, []);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const addLine = useCallback(
    (newLine: NewCartLine, options?: AddLineOptions) => {
      const line = parseCartLine({ ...newLine, id: cartLineId(newLine) }, products);
      if (!line) {
        if (process.env.NODE_ENV !== "production") console.warn("addLine: ignored an invalid cart line", newLine);
        return;
      }
      store.update((current) => ({ ...current, lines: mergeLines([...current.lines, line]) }));
      track("add_to_cart", getLineAnalytics(line, products));
      announce(site.cartAnnouncements.added(getCartLineName(line, products)));
      if (options?.open ?? true) setOpen(true);
    },
    [announce, products, store],
  );

  const removeLine = useCallback(
    (lineId: string) => {
      const line = store.getState().lines.find((candidate) => candidate.id === lineId);
      if (!line) return;
      store.update((current) => ({
        ...current,
        lines: current.lines.filter((candidate) => candidate.id !== lineId),
      }));
      announce(site.cartAnnouncements.removed(getCartLineName(line, products)));
    },
    [announce, products, store],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number) => {
      const next = Number.isFinite(quantity) ? clampQuantity(quantity) : 0;
      if (next === 0) {
        removeLine(lineId);
        return;
      }
      const line = store.getState().lines.find((candidate) => candidate.id === lineId);
      if (!line || line.quantity === next) return;
      store.update((current) => ({
        ...current,
        lines: current.lines.map((candidate) => (candidate.id === lineId ? { ...candidate, quantity: next } : candidate)),
      }));
      announce(site.cartAnnouncements.quantity(getCartLineName(line, products), next));
    },
    [announce, products, removeLine, store],
  );

  const applyDiscountCode = useCallback(
    (code: string): ApplyDiscountResult => {
      const normalized = normalizeDiscountCode(code);
      if (!normalized || normalized.length > MAX_CODE_LENGTH) return { ok: false, error: "unknown" };
      // Reading the clock here is fine: this runs in an event handler, not during render.
      const result = validateDiscountCode(normalized, new Date());
      if (!result.valid) return { ok: false, error: result.error };
      const stored = normalizeDiscountCode(result.code.code);
      store.update((current) => (current.discountCode === stored ? current : { ...current, discountCode: stored }));
      announce(site.cartAnnouncements.discountApplied(result.code.code));
      return { ok: true };
    },
    [announce, store],
  );

  const clearDiscountCode = useCallback(() => {
    if (store.getState().discountCode === null) return;
    store.update((current) => ({ ...current, discountCode: null }));
    announce(site.cartAnnouncements.discountRemoved);
  }, [announce, store]);

  const setCountry = useCallback(
    (code: CountryCode) => {
      if (!isCountryCode(code)) return;
      store.update((current) => (current.country === code ? current : { ...current, country: code }));
    },
    [store],
  );

  const clear = useCallback(() => {
    store.update((current) =>
      current.lines.length === 0 && current.discountCode === null
        ? current
        : { ...current, lines: [], discountCode: null },
    );
    announce(site.cartAnnouncements.cleared);
  }, [announce, store]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      discountCode,
      country,
      pricing,
      itemCount: pricing.itemCount,
      hydrated,
      isOpen,
      openCart,
      closeCart,
      setOpen,
      addLine,
      setQuantity,
      removeLine,
      applyDiscountCode,
      clearDiscountCode,
      setCountry,
      clear,
    }),
    [
      lines,
      discountCode,
      country,
      pricing,
      hydrated,
      isOpen,
      openCart,
      closeCart,
      addLine,
      setQuantity,
      removeLine,
      applyDiscountCode,
      clearDiscountCode,
      setCountry,
      clear,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Polite announcements for cart changes. aria-live keeps it audible while a modal dialog hides the rest of the page. */}
      <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
        {announcement ? <span key={announcement.id}>{announcement.text}</span> : null}
      </div>
    </CartContext.Provider>
  );
}

/** The cart. Throws when used outside <CartProvider>. */
export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart() must be used inside <CartProvider>.");
  return value;
}
