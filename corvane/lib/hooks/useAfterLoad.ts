"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * "The page has settled": true once the window has loaded and the main thread
 * is idle, or as soon as the visitor first interacts (pointer down, key down,
 * touch, scroll), whichever comes first. It never turns false again.
 *
 * Used to mount client islands that are not part of the first view (cart
 * drawer, mobile menu sheet, email capture) after the page has painted and
 * hydrated, so their code stays out of the initial JavaScript and off the
 * main thread while the page loads (docs/PLAN.md §12, phase 8). An
 * interaction mounts them right away: pointerdown and keydown come before
 * the click that opens a drawer, so its code is usually there in time.
 */

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

/** Upper bound for the idle wait after `load`, so a busy page still gets its islands. */
const IDLE_TIMEOUT_MS = 2000;

let ready = false;
let armed = false;
const listeners = new Set<() => void>();

function settle(): void {
  if (ready) return;
  ready = true;
  for (const type of INTERACTION_EVENTS) window.removeEventListener(type, settle, true);
  listeners.forEach((listener) => listener());
}

function whenIdle(): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(settle, { timeout: IDLE_TIMEOUT_MS });
  } else {
    setTimeout(settle, 200);
  }
}

/** Starts listening once, in the browser, when the first component subscribes. */
function arm(): void {
  if (armed) return;
  armed = true;
  for (const type of INTERACTION_EVENTS) window.addEventListener(type, settle, { capture: true, passive: true });
  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  arm();
  return () => {
    listeners.delete(onChange);
  };
}

const getSnapshot = () => ready;
const getServerSnapshot = () => false;

/**
 * True after load and idle, or after the first interaction (see above).
 * False on the server, during prerender and during hydration.
 */
export function useAfterLoad(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Once `value` has been true, stays true (for a lazily mounted island that
 * must stay mounted after it was needed once, e.g. to play its closing
 * animation and return focus).
 */
export function useLatch(value: boolean): boolean {
  const [latched, setLatched] = useState(value);
  // Adjusting state while rendering (React's "storing information from previous renders").
  if (value && !latched) setLatched(true);
  return latched || value;
}
