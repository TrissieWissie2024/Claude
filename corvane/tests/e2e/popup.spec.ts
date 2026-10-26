import { expect, test, type Page } from "@playwright/test";

import { site } from "@/content/site";

/**
 * The email popup opens on its own at most once (brief §2.8 and §7,
 * docs/PLAN.md §10 and §15): 8 seconds after the page starts loading, or on
 * exit intent with a mouse, then not again within the 7-day cooldown, not
 * after a reload and not on another page; again once the cooldown has passed.
 * Opening it from the pill counts as being shown. Without working storage it
 * never opens on its own. The pill keeps opening it on request.
 *
 * Uses the plain Playwright `test` (no popup suppression) and a fresh context
 * per test, so storage starts empty. The unit rules are in
 * components/email/state.test.ts.
 */

const copy = site.emailCapture;
const DAY_MS = 24 * 60 * 60 * 1000;
const START = new Date("2026-10-27T10:00:00+01:00");

/** Moves the mouse out through the top edge of the window (desktop exit intent). */
async function exitIntent(page: Page) {
  await page.mouse.move(700, 200);
  await page.mouse.move(700, -20, { steps: 4 });
}

function popup(page: Page) {
  return page.getByRole("dialog", { name: copy.title });
}

function pill(page: Page) {
  return page.locator("div[data-email-pill]").getByRole("button", { name: new RegExp(`^${copy.pillLabel}`) });
}

/**
 * Proves the email capture is mounted on this page (it mounts lazily, once the
 * page has settled): scrolling 240 px reveals its pill. Then moves the clock
 * on once more, so an auto-open timer that is due would have fired.
 */
async function expectCaptureMountedAndQuiet(page: Page) {
  await page.mouse.wheel(0, 400);
  await expect(pill(page)).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("the popup opens once, then not after a reload or on another page; the pill still opens it", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-27T10:00:00+01:00") });

  // First visit: nothing before the delay, the dialog after it.
  await page.goto("/");
  await page.clock.runFor(copy.delayMs - 2000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.clock.runFor(2000);
  await expect(popup(page)).toBeVisible();
  await expect(popup(page)).toContainText(copy.sameRewardNote);

  await popup(page).getByRole("button", { name: copy.close, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Reload: the stored last-shown time keeps it closed.
  await page.reload();
  await page.clock.runFor(copy.delayMs);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectCaptureMountedAndQuiet(page);

  // Another page, a fresh load: still closed.
  await page.goto("/about");
  await page.clock.runFor(copy.delayMs);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectCaptureMountedAndQuiet(page);

  // The pill opens it on request.
  await pill(page).click();
  await expect(popup(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the popup does not open on its own within the cooldown after a client-side navigation", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-27T10:00:00+01:00") });
  await page.goto("/");
  await page.clock.runFor(copy.delayMs);
  await expect(popup(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Navigate inside the app (no new document) and wait out the delay again.
  await page.getByRole("contentinfo").getByRole("link", { name: "FAQ", exact: true }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.clock.runFor(copy.delayMs);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("opening it from the pill and declining starts the cooldown as well", async ({ page }) => {
  await page.clock.install({ time: START });
  await page.goto("/");

  // Before the 8-second timer: the visitor opens it and says no.
  await page.mouse.wheel(0, 400);
  await expect(pill(page)).toBeVisible();
  await pill(page).click();
  await expect(popup(page)).toBeVisible();
  await popup(page).getByRole("button", { name: copy.dismiss, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Not on its own later in this load, nor after a reload within the cooldown.
  await page.clock.runFor(copy.delayMs);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.clock.runFor(copy.delayMs + 1000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectCaptureMountedAndQuiet(page);
});

test("exit intent opens it on desktop, before the timer", async ({ page, isMobile }) => {
  test.skip(isMobile, "Exit intent only applies to a fine pointer (a mouse).");
  await page.clock.install({ time: START });
  await page.goto("/about");

  // Mount the capture (a scroll settles the page), then leave through the top edge.
  await page.mouse.wheel(0, 400);
  await expect(pill(page)).toBeVisible();
  await exitIntent(page);
  await expect(popup(page)).toBeVisible();
  expect(await page.evaluate(() => performance.now())).toBeLessThan(copy.delayMs);

  // Shown once: closing it and leaving again does not bring it back.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await exitIntent(page);
  await page.clock.runFor(copy.delayMs);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("without working storage it never opens on its own; the pill still opens it", async ({ page, isMobile }) => {
  // Blocked site data: reading window.localStorage throws, as in Chrome with storage blocked.
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is blocked.", "SecurityError");
      },
    });
  });
  await page.clock.install({ time: START });
  await page.goto("/");

  await page.mouse.wheel(0, 400);
  await expect(pill(page)).toBeVisible();
  if (!isMobile) await exitIntent(page);
  await page.clock.runFor(copy.delayMs + 1000);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await pill(page).click();
  await expect(popup(page)).toBeVisible();
});

test("once the 7-day cooldown has passed it opens on its own again", async ({ page }) => {
  await page.clock.install({ time: START });
  await page.goto("/");
  await page.clock.runFor(copy.delayMs);
  await expect(popup(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // A minute short of 7 days: still closed.
  await page.clock.fastForward(7 * DAY_MS - 60_000 - copy.delayMs);
  await page.reload();
  await page.clock.runFor(copy.delayMs + 1000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectCaptureMountedAndQuiet(page);

  // A minute past 7 days: it opens once more. The capture is mounted first (the pill shows), so
  // its timer is armed before the clock moves on.
  await page.clock.fastForward(2 * 60_000);
  await page.reload();
  await page.mouse.wheel(0, 400);
  await expect(pill(page)).toBeVisible();
  await page.clock.runFor(copy.delayMs + 1000);
  await expect(popup(page)).toBeVisible();
});
