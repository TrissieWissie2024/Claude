"use client";

import { useSyncExternalStore } from "react";

import { site } from "@/content/site";
import { readJson, removeStorage, storageKeys, writeJson, writeStorage } from "@/lib/storage";

/**
 * State helpers for the email capture (docs/PLAN.md §10, brief §2.8).
 *
 * - Auto-open rules: only when storage works (a test write succeeds), the
 *   visitor has not signed up and the last auto-open
 *   (storageKeys.emailCaptureLastShown, a timestamp in ms) is missing or at
 *   least `cooldownDays` old. The timestamp is written at the moment of an
 *   auto-open; when that write fails the popup does not open.
 * - Pill dismissal: sessionStorage, so it lasts for this visit only. Without
 *   sessionStorage it lasts until the page reloads.
 * - Body flags: the mobile sticky add-to-cart sets data-sticky-atc="true" and
 *   the consent banner data-consent-open="true" on <body>; the pill hides and
 *   the popup does not open on its own while either is set.
 *
 * Everything reads the browser only after mount (useSyncExternalStore with a
 * server snapshot), so nothing here causes a hydration mismatch.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** sessionStorage key for "the visitor hid the pill during this visit". */
export const PILL_DISMISSED_KEY = storageKeys.emailCapturePillDismissed;

const STORAGE_TEST_KEY = "corvane:email-capture:test";

/** Desktop exit intent only applies to a precise pointer (a mouse or trackpad). */
export const EXIT_INTENT_QUERY = "(pointer: fine)";

/** /checkout and anything under it: no pill and no popup there. */
export function isCheckoutPath(pathname: string | null): boolean {
  return pathname === "/checkout" || (pathname?.startsWith("/checkout/") ?? false);
}

/* ------------------------------------------------------------------ */
/* Cooldown and sign-up (localStorage)                                 */
/* ------------------------------------------------------------------ */

function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * True when the cooldown since the last auto-open has passed. A missing or
 * unreadable value counts as "never shown". A timestamp in the future (a
 * clock that moved back) counts as recent, so the cap is never skipped.
 */
export function isCooldownOver(lastShown: unknown, now: number, cooldownDays: number): boolean {
  const shownAt = toTimestamp(lastShown);
  if (shownAt === null) return true;
  return now - shownAt >= cooldownDays * DAY_MS;
}

/** True when localStorage accepts a write right now. */
export function storageWorks(): boolean {
  if (!writeStorage(STORAGE_TEST_KEY, "1")) return false;
  removeStorage(STORAGE_TEST_KEY);
  return true;
}

/** True when the visitor signed up through the popup on this device. */
export function hasSubscribed(): boolean {
  const value = readJson<unknown>(storageKeys.emailCaptureSubscribed);
  return value !== null && value !== false;
}

/** Whether the popup may open on its own now: storage works, no sign-up, cooldown over. */
export function canAutoOpen(now: number): boolean {
  if (!site.emailCapture.enabled) return false;
  if (!storageWorks()) return false;
  if (hasSubscribed()) return false;
  return isCooldownOver(readJson<unknown>(storageKeys.emailCaptureLastShown), now, site.emailCapture.cooldownDays);
}

/** Stores the moment of an auto-open. False when storage refused the write (then do not open). */
export function markAutoOpened(now: number): boolean {
  return writeJson(storageKeys.emailCaptureLastShown, now);
}

const subscribedListeners = new Set<() => void>();
/** In-memory fallback, so the code stays reachable this visit when storage is blocked. */
let subscribedThisVisit = false;

function notifySubscribed(): void {
  subscribedListeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key === storageKeys.emailCaptureSubscribed) notifySubscribed();
}

function subscribeSubscribed(listener: () => void): () => void {
  if (subscribedListeners.size === 0) window.addEventListener("storage", onStorage);
  subscribedListeners.add(listener);
  return () => {
    subscribedListeners.delete(listener);
    if (subscribedListeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSubscribed(): boolean {
  return subscribedThisVisit || hasSubscribed();
}

/** Records a successful sign-up (popup never opens on its own again). Call from an event handler. */
export function markSubscribed(): void {
  subscribedThisVisit = true;
  writeJson(storageKeys.emailCaptureSubscribed, true);
  notifySubscribed();
}

/** Whether the visitor has signed up. False on the server and during hydration. */
export function useSubscribed(): boolean {
  return useSyncExternalStore(subscribeSubscribed, getSubscribed, () => false);
}

/* ------------------------------------------------------------------ */
/* Pill dismissal (sessionStorage)                                     */
/* ------------------------------------------------------------------ */

const dismissedListeners = new Set<() => void>();
let dismissedInMemory = false;

/** True when the visitor hid the pill during this visit. */
export function isPillDismissed(): boolean {
  if (dismissedInMemory) return true;
  try {
    return window.sessionStorage.getItem(PILL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Hides the pill for the rest of the visit. Call from an event handler. */
export function dismissPill(): void {
  dismissedInMemory = true;
  try {
    window.sessionStorage.setItem(PILL_DISMISSED_KEY, "1");
  } catch {
    // Without sessionStorage the pill stays hidden until the page reloads.
  }
  dismissedListeners.forEach((listener) => listener());
}

function subscribeDismissed(listener: () => void): () => void {
  dismissedListeners.add(listener);
  return () => {
    dismissedListeners.delete(listener);
  };
}

/** Whether the pill was hidden this visit. True on the server (the pill renders after mount only). */
export function usePillDismissed(): boolean {
  return useSyncExternalStore(subscribeDismissed, isPillDismissed, () => true);
}

/* ------------------------------------------------------------------ */
/* Body flags (sticky add-to-cart, consent banner)                     */
/* ------------------------------------------------------------------ */

const BODY_FLAG_ATTRIBUTES = ["data-sticky-atc", "data-consent-open"];

/** True while the mobile sticky add-to-cart is visible or a consent banner is open. */
export function bodyBlocksPill(): boolean {
  const flags = document.body.dataset;
  return flags.stickyAtc === "true" || flags.consentOpen === "true";
}

function subscribeBodyFlags(listener: () => void): () => void {
  const observer = new MutationObserver(listener);
  observer.observe(document.body, { attributes: true, attributeFilter: BODY_FLAG_ATTRIBUTES });
  return () => observer.disconnect();
}

/** bodyBlocksPill(), kept live with a MutationObserver. False on the server. */
export function useBodyBlocksPill(): boolean {
  return useSyncExternalStore(subscribeBodyFlags, bodyBlocksPill, () => false);
}

/* ------------------------------------------------------------------ */
/* Mount and page state                                                */
/* ------------------------------------------------------------------ */

function subscribeNothing(): () => void {
  return () => {};
}

/** False on the server and during hydration, true afterwards. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** True while the visitor is typing or choosing in a form field (the popup never interrupts that). */
export function isEditingField(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return true;
  if (active instanceof HTMLInputElement) {
    return !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "image"].includes(active.type);
  }
  return false;
}

/** True while any dialog (cart drawer, mobile menu, another modal) is open. */
export function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]') !== null;
}
