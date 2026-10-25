"use client";

import { useSyncExternalStore } from "react";

/** Tailwind `lg` (64rem): the desktop header and the inline USP bar start here. */
export const DESKTOP_QUERY = "(min-width: 64rem)";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface MediaStore {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => boolean;
}

/** One store per query, so subscribe stays referentially stable across renders. */
const stores = new Map<string, MediaStore>();

function getStore(query: string): MediaStore {
  const existing = stores.get(query);
  if (existing) return existing;
  const store: MediaStore = {
    subscribe(onChange) {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    getSnapshot: () => window.matchMedia(query).matches,
  };
  stores.set(query, store);
  return store;
}

/**
 * Whether a media query matches. Returns `serverValue` on the server, during
 * prerender and during hydration (no mismatch), then the live value.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const store = getStore(query);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverValue);
}
