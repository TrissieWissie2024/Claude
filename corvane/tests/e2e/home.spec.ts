import { collectConsoleProblems, expect, gotoHydrated, promoBar, test } from "./fixtures";

/** The homepage loads cleanly (brief §7, docs/PLAN.md §15). */

test("the homepage loads with its chrome, one h1 and no console errors", async ({ page }) => {
  const problems = collectConsoleProblems(page);
  await gotoHydrated(page, "/");

  // The page's only h1 (the hero) is visible.
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toBeVisible();
  await expect(h1).toContainText("Cologne that fits");

  // Chrome around every page (docs/PLAN.md §10): promo bar, sticky header, main, footer.
  await expect(promoBar(page)).toBeVisible();
  await expect(promoBar(page)).toContainText("LAUNCH15");
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  await expect(header.getByRole("link", { name: /home/i })).toBeVisible();
  await expect(header.getByRole("button", { name: /^Cart, / })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  // Let late work finish (prefetches, lazily mounted islands) before judging the console.
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});
