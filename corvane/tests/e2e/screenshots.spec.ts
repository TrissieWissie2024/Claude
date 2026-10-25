import path from "node:path";

import type { Page, TestInfo } from "@playwright/test";

import { addFromProductPage, expect, gotoHydrated, settleAnimations, test } from "./fixtures";

/**
 * Screenshots for the visual check (brief §10, docs/PLAN.md §15): home,
 * collection, product page and the open cart drawer with 3 sticks, at
 * 390 × 844 (project "mobile") and 1440 × 900 (project "desktop"). Saved as
 * screenshots/<view>-<width>.png in the project (gitignored).
 *
 * Skipped in the normal run; `npm run screenshots` sets SCREENSHOTS=1.
 * The page clock is pinned inside the campaign, so the bar shows its countdown.
 */

test.skip(!process.env.SCREENSHOTS, "Set SCREENSHOTS=1 (npm run screenshots) to take screenshots.");

/** <project root>/screenshots/<view>-<width>.png (testDir is <project root>/tests/e2e). */
function screenshotPath(page: Page, testInfo: TestInfo, view: string): string {
  const width = page.viewportSize()?.width ?? 0;
  return path.join(testInfo.project.testDir, "..", "..", "screenshots", `${view}-${width}.png`);
}

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await settleAnimations(page);
}

const pages: [view: string, url: string][] = [
  ["home", "/"],
  ["collection", "/collections/all"],
  ["product", "/products/north-swell"],
];

for (const [view, url] of pages) {
  test(`${view} (full page)`, async ({ page }, testInfo) => {
    await gotoHydrated(page, url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await ready(page);
    await page.screenshot({ path: screenshotPath(page, testInfo, view), fullPage: true, animations: "disabled" });
  });
}

test("cart drawer with 3 sticks (viewport)", async ({ page }, testInfo) => {
  const drawer = await addFromProductPage(page, "north-swell", { sticks: 3 });
  await expect(drawer.getByRole("heading", { name: "Set of 3" })).toBeVisible();
  await ready(page);
  await page.screenshot({ path: screenshotPath(page, testInfo, "cart-drawer"), animations: "disabled" });
});
