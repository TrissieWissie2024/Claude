"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { offers } from "@/content/offers";
import type { BundleSize, PurchasePlan, PurchaseType, SubscriptionInterval } from "@/lib/types";

/**
 * Product page choices that survive switching scents (docs/PLAN.md §9).
 * Mounted once in app/products/layout.tsx; the layout stays mounted while the
 * visitor moves between /products/north-swell, /products/dune-fig and so on
 * (the scent swatches are links), so the tile, purchase type, interval and
 * extra sticks they picked stay as they were. In memory only: a reload starts
 * from the defaults again.
 *
 * Stick 1 of a set is always the scent of the page and is not stored here.
 * Sticks 2 and 3 are stored as a slug, or null for "the scent of the page":
 * an untouched slot follows the page when the visitor switches scents, a slot
 * they set to another scent keeps it.
 *
 * Defaults: 1 stick, one-time, offers.subscription.defaultIntervalMonths.
 * One stick is the neutral starting point: the 3-stick tile is labelled
 * "Best value" and shows its saving, so it does not need to be preselected
 * to be noticed.
 */

/** Slugs of sticks 2 and 3; null means "same as the page scent". */
export type ExtraScents = readonly [string | null, string | null];

export interface PdpState {
  bundleSize: BundleSize;
  purchaseType: PurchaseType;
  /** Kept while one-time is selected, so switching back to Subscribe & save restores it. */
  intervalMonths: SubscriptionInterval;
  /** [stick 2, stick 3]. Only the first bundleSize - 1 entries are used. */
  extraScents: ExtraScents;
}

export interface PdpStateValue extends PdpState {
  setBundleSize: (size: BundleSize) => void;
  setPurchaseType: (type: PurchaseType) => void;
  setIntervalMonths: (months: SubscriptionInterval) => void;
  /**
   * Sets stick 2 (slot 0) or stick 3 (slot 1). Pass the page slug as
   * `pageSlug`: choosing the page scent stores null, so the slot keeps
   * following the page.
   */
  setExtraScent: (slot: 0 | 1, slug: string, pageSlug: string) => void;
  /** The plan for a cart line: one-time, or subscription with the chosen interval. */
  plan: PurchasePlan;
}

export const DEFAULT_PDP_STATE: PdpState = {
  bundleSize: 1,
  purchaseType: "one-time",
  intervalMonths: offers.subscription.defaultIntervalMonths,
  extraScents: [null, null],
};

const PdpStateContext = createContext<PdpStateValue | null>(null);

export interface PdpStateProviderProps {
  children: ReactNode;
  /** Starting state (previews and tests). Defaults to DEFAULT_PDP_STATE. */
  initialState?: Partial<PdpState>;
}

export function PdpStateProvider({ children, initialState }: PdpStateProviderProps) {
  const [state, setState] = useState<PdpState>(() => ({ ...DEFAULT_PDP_STATE, ...initialState }));

  const setBundleSize = useCallback((bundleSize: BundleSize) => {
    setState((current) => (current.bundleSize === bundleSize ? current : { ...current, bundleSize }));
  }, []);

  const setPurchaseType = useCallback((purchaseType: PurchaseType) => {
    setState((current) => (current.purchaseType === purchaseType ? current : { ...current, purchaseType }));
  }, []);

  const setIntervalMonths = useCallback((intervalMonths: SubscriptionInterval) => {
    if (!offers.subscription.intervalsMonths.includes(intervalMonths)) return;
    setState((current) => (current.intervalMonths === intervalMonths ? current : { ...current, intervalMonths }));
  }, []);

  const setExtraScent = useCallback((slot: 0 | 1, slug: string, pageSlug: string) => {
    const value = slug === pageSlug ? null : slug;
    setState((current) => {
      if (current.extraScents[slot] === value) return current;
      const extraScents: ExtraScents =
        slot === 0 ? [value, current.extraScents[1]] : [current.extraScents[0], value];
      return { ...current, extraScents };
    });
  }, []);

  const value = useMemo<PdpStateValue>(
    () => ({
      ...state,
      plan:
        state.purchaseType === "subscription"
          ? { type: "subscription", intervalMonths: state.intervalMonths }
          : { type: "one-time" },
      setBundleSize,
      setPurchaseType,
      setIntervalMonths,
      setExtraScent,
    }),
    [state, setBundleSize, setPurchaseType, setIntervalMonths, setExtraScent],
  );

  return <PdpStateContext.Provider value={value}>{children}</PdpStateContext.Provider>;
}

/** The product page choices. Throws when used outside <PdpStateProvider> (app/products/layout.tsx). */
export function usePdpState(): PdpStateValue {
  const value = useContext(PdpStateContext);
  if (!value) throw new Error("usePdpState() must be used inside <PdpStateProvider> (app/products/layout.tsx).");
  return value;
}

/**
 * The scents of the chosen set, stick 1 first: the page scent, then sticks 2
 * and 3 (null resolves to the page scent). Slugs that are not in `validSlugs`
 * also fall back to the page scent.
 */
export function resolveSetScents(
  pageSlug: string,
  bundleSize: BundleSize,
  extraScents: ExtraScents,
  validSlugs?: readonly string[],
): string[] {
  const extras = extraScents.slice(0, bundleSize - 1).map((slug) => {
    if (slug === null) return pageSlug;
    if (validSlugs && !validSlugs.includes(slug)) return pageSlug;
    return slug;
  });
  return [pageSlug, ...extras];
}
