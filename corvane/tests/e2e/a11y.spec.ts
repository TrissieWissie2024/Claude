import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { addFromProductPage, expect, gotoHydrated, settleAnimations, test } from "./fixtures";

/**
 * axe (WCAG 2.0 A and AA rules) on the key pages and the open cart drawer
 * (brief §7, docs/PLAN.md §12). The page clock is pinned inside the campaign,
 * so the campaign bar (the only countdown) is part of every check.
 */

/**
 * @axe-core/playwright types its `page` with the top-level playwright-core
 * (1.64, installed as its peer), while @playwright/test 1.63 brings its own.
 * The two Page types differ only in members axe never calls; at runtime axe
 * uses nothing from playwright-core.
 */
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]["page"];

async function expectNoViolations(page: Page, label: string) {
  await settleAnimations(page);
  const { violations } = await new AxeBuilder({ page: page as unknown as AxePage })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const summary = violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary, `${label}: axe violations`).toEqual([]);
}

for (const path of ["/", "/collections/all", "/products/north-swell", "/checkout"]) {
  test(`${path} has no axe violations`, async ({ page }) => {
    await gotoHydrated(page, path);
    await expectNoViolations(page, path);
  });
}

test("the open cart drawer has no axe violations", async ({ page }) => {
  const drawer = await addFromProductPage(page, "north-swell", { sticks: 2 });
  await expect(drawer.getByRole("button", { name: "Checkout" })).toBeVisible();
  await expectNoViolations(page, "cart drawer");
});

test("the empty cart drawer has no axe violations", async ({ page }) => {
  await gotoHydrated(page, "/");
  await page.getByRole("banner").getByRole("button", { name: /^Cart, / }).click();
  await expect(page.getByRole("dialog", { name: "Your cart" }).getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await expectNoViolations(page, "empty cart drawer");
});
