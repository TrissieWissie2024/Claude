/**
 * localStorage access that never throws. Storage can be unavailable
 * (private mode, blocked cookies, SSR); callers get null or false instead.
 */

export function readStorage(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore: nothing to clean up when storage is unavailable.
  }
}

export function readJson<T>(key: string): T | null {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    return writeStorage(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/** Storage keys used across the site, in one place. */
export const storageKeys = {
  cart: "corvane:cart:v1",
  country: "corvane:country:v1",
  emailCaptureLastShown: "corvane:email-capture:last-shown",
  emailCaptureSubscribed: "corvane:email-capture:subscribed",
  /** sessionStorage (not localStorage): the visitor hid the email capture pill for this visit. */
  emailCapturePillDismissed: "corvane:email-capture:pill-dismissed",
  consent: "corvane:consent:v1",
} as const;
