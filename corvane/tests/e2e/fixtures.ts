import { test as base, expect, type Locator, type Page } from "@playwright/test";

import { offers } from "@/content/offers";
import { storageKeys } from "@/lib/storage";

/**
 * Shared helpers for the Playwright smoke tests (docs/PLAN.md §15). Specs
 * import `test` and `expect` from here instead of @playwright/test, so every
 * page starts with the email popup suppressed (see `suppressEmailPopup`).
 * Only popup.spec.ts (and email-capture.spec.ts, which tests the sign-up
 * rules) use the plain Playwright `test`.
 *
 * Next 16.4 keeps the previous route mounted but hidden after a client
 * navigation (React Activity), so locators here use roles (which skip hidden
 * elements) or explicit visibility filters, never a bare `locator("h1")`.
 */

export { expect };

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** The campaign's fixed end, from content/offers.ts (never computed from the build or the visit). */
export const CAMPAIGN_ENDS_AT = Date.parse(offers.campaign.endsAt);

/**
 * A moment while the launch campaign runs: 2 days, 5 hours and 30 minutes
 * before its end, so the countdown reads "2d 5h". Specs pin the page clock to
 * it (page.clock.setFixedTime), so they do not depend on the real date.
 */
export const DURING_CAMPAIGN = new Date(CAMPAIGN_ENDS_AT - (2 * DAY + 5 * HOUR + 30 * MINUTE));

/** Some time after the campaign's end. */
export const AFTER_CAMPAIGN = new Date(CAMPAIGN_ENDS_AT + 10 * HOUR);

/**
 * Stored as the last auto-open of the email popup. A timestamp in the future
 * always counts as recent (components/email/state.ts, isCooldownOver), so the
 * popup stays closed whatever the page clock says.
 */
const FAR_FUTURE_MS = Date.parse("2100-01-01T00:00:00Z");

export const test = base.extend<{ suppressEmailPopup: void }>({
  /** Seeds `corvane:email-capture:last-shown` before any page script runs, on every navigation. */
  suppressEmailPopup: [
    async ({ context }, use) => {
      await context.addInitScript(
        ([key, value]) => {
          try {
            window.localStorage.setItem(key, value);
          } catch {
            // No storage: the popup never opens on its own anyway.
          }
        },
        [storageKeys.emailCaptureLastShown, JSON.stringify(FAR_FUTURE_MS)] as const,
      );
      await use();
    },
    { auto: true },
  ],
});

/* ------------------------------------------------------------------ */
/* Locators                                                            */
/* ------------------------------------------------------------------ */

/** The promo bar above the header (section aria-label "Announcements"). */
export function promoBar(page: Page): Locator {
  return page.getByRole("region", { name: "Announcements" });
}

/** The header's cart button ("Cart, 2 items"). Hidden from the accessibility tree while a drawer or modal is open. */
export function cartButton(page: Page): Locator {
  return page.getByRole("banner").getByRole("button", { name: /^Cart, / });
}

/** The cart drawer (Radix Dialog titled "Your cart"). */
export function cartDrawer(page: Page): Locator {
  return page.getByRole("dialog", { name: "Your cart" });
}

/** The value of the "Subtotal" row in the cart drawer. */
export function drawerSubtotal(drawer: Locator): Locator {
  return drawer.locator("dt", { hasText: /^Subtotal/ }).locator("xpath=following-sibling::dd[1]");
}

/** The product page's main Add to cart button ("Add to cart €24.95"), not the sticky bar's. */
export function mainAddToCart(page: Page): Locator {
  return page.getByRole("main").getByRole("button", { name: /^Add to cart\b/ }).first();
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Pins the page clock inside the campaign, opens `path` and waits until the
 * app has hydrated: the promo bar only renders the campaign message (with its
 * <time datetime=endsAt>) after mount, once useNow() has read the clock. From
 * then on clicks reach React. Returns the navigation response.
 */
export async function gotoHydrated(page: Page, path: string, { status = 200 }: { status?: number } = {}) {
  await page.clock.setFixedTime(DURING_CAMPAIGN);
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(status);
  await expect(promoBar(page).locator(`time[datetime="${offers.campaign.endsAt}"]`), path).toBeAttached();
  return response;
}

/**
 * Proves that the client clock has been read, without depending on the
 * campaign: the cart drawer shows its empty state only once the cart has
 * hydrated, which needs the same shared 1-second clock (useNow(1000)) as the
 * promo bar. Opens the empty cart, checks, closes it again.
 */
export async function expectClientClockRead(page: Page) {
  await cartButton(page).click();
  const drawer = cartDrawer(page);
  await expect(drawer.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
}

/**
 * Opens a product page, picks a bundle tile (sticks only) and adds it with
 * the main Add to cart button. The cart drawer opens with the line; returns it.
 */
export async function addFromProductPage(page: Page, slug: string, { sticks }: { sticks?: 1 | 2 | 3 } = {}) {
  await gotoHydrated(page, `/products/${slug}`);
  if (sticks) {
    // The radio is visually hidden inside its tile; click the tile (the <label>) like a visitor.
    const radio = page.getByRole("radio", { name: new RegExp(`^${sticks} sticks?\\b`) });
    await page.locator("label").filter({ has: radio }).click();
    await expect(radio).toBeChecked();
  }
  await mainAddToCart(page).click();
  const drawer = cartDrawer(page);
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("list", { name: "Items in your cart" })).toBeVisible();
  return drawer;
}

/* ------------------------------------------------------------------ */
/* Page state                                                          */
/* ------------------------------------------------------------------ */

/** Waits until no finite CSS animation or transition is running (slide-ins, fades), so boxes and colours are final. */
export async function settleAnimations(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running")
            .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).length,
      ),
    )
    .toBe(0);
}

/**
 * Collects console errors, warnings about hydration and uncaught page errors
 * from the moment it is called. Check the returned array at the end of a test.
 */
export function collectConsoleProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") problems.push(`console.error: ${text}`);
    else if (/hydrat/i.test(text)) problems.push(`console.${message.type()}: ${text}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

/** Bounding boxes overlap (touching edges do not count). */
export function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
