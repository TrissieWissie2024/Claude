import { expect, test, type Page } from "@playwright/test";

import { site } from "@/content/site";

/**
 * The email popup opens on its own at most once (brief §2.8 and §7,
 * docs/PLAN.md §10 and §15): 8 seconds after the page starts loading, then
 * not again within the 7-day cooldown, not after a reload and not on another
 * page. The pill keeps opening it on request.
 *
 * Uses the plain Playwright `test` (no popup suppression) and a fresh context
 * per test, so storage starts empty.
 */

const copy = site.emailCapture;

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
