import { afterEach, describe, expect, it, vi } from "vitest";

import { site } from "@/content/site";
import { storageKeys } from "@/lib/storage";

import { canAutoOpen, isCooldownOver, markShown } from "./state";

/*
 * Email popup frequency (brief §2.8 and §6.6, docs/PLAN.md §10): it opens on
 * its own at most once per cooldownDays (7), never without working storage
 * and never after a sign-up. The Playwright specs in tests/e2e/popup.spec.ts
 * check the same rules in a browser.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-27T09:00:00Z");
const COOLDOWN = site.emailCapture.cooldownDays;

/** A small in-memory localStorage. */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

/** localStorage that throws on every call, as with blocked site data. */
function blockedStorage(): Storage {
  const fail = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isCooldownOver", () => {
  it("is over when the offer was never shown or the value is unreadable", () => {
    expect(isCooldownOver(null, NOW, COOLDOWN)).toBe(true);
    expect(isCooldownOver("not a date", NOW, COOLDOWN)).toBe(true);
    expect(isCooldownOver({}, NOW, COOLDOWN)).toBe(true);
  });

  it("is not over within 7 days, and over from exactly 7 days", () => {
    expect(isCooldownOver(NOW - 1, NOW, COOLDOWN)).toBe(false);
    expect(isCooldownOver(NOW - (COOLDOWN * DAY_MS - 1), NOW, COOLDOWN)).toBe(false);
    expect(isCooldownOver(NOW - COOLDOWN * DAY_MS, NOW, COOLDOWN)).toBe(true);
    expect(isCooldownOver(NOW - 8 * DAY_MS, NOW, COOLDOWN)).toBe(true);
  });

  it("treats a time in the future (a clock moved back) as recent", () => {
    expect(isCooldownOver(NOW + DAY_MS, NOW, COOLDOWN)).toBe(false);
  });

  it("reads ISO strings as well as numbers", () => {
    expect(isCooldownOver(new Date(NOW - DAY_MS).toISOString(), NOW, COOLDOWN)).toBe(false);
  });
});

describe("canAutoOpen", () => {
  it("never opens without storage: no window, or storage that throws", () => {
    expect(canAutoOpen(NOW)).toBe(false);
    vi.stubGlobal("window", { localStorage: blockedStorage() });
    expect(canAutoOpen(NOW)).toBe(false);
    expect(markShown(NOW)).toBe(false);
  });

  it("opens on a first visit with working storage", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage() });
    expect(canAutoOpen(NOW)).toBe(true);
  });

  it("stays closed within the cooldown after markShown and opens again once it has passed", () => {
    const storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    expect(markShown(NOW)).toBe(true);
    expect(storage.getItem(storageKeys.emailCaptureLastShown)).toBe(String(NOW));
    expect(canAutoOpen(NOW + DAY_MS)).toBe(false);
    expect(canAutoOpen(NOW + COOLDOWN * DAY_MS - 60_000)).toBe(false);
    expect(canAutoOpen(NOW + COOLDOWN * DAY_MS + 60_000)).toBe(true);
  });

  it("never opens after a sign-up, also after the cooldown", () => {
    vi.stubGlobal("window", {
      localStorage: memoryStorage({
        [storageKeys.emailCaptureSubscribed]: "true",
        [storageKeys.emailCaptureLastShown]: String(NOW - 30 * DAY_MS),
      }),
    });
    expect(canAutoOpen(NOW)).toBe(false);
  });

  it("cleans up its storage test key", () => {
    const storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    canAutoOpen(NOW);
    expect(storage.length).toBe(0);
  });
});
