import type { APIRequestContext, Page } from "@playwright/test";

import { boxesOverlap, expect, gotoHydrated, mainAddToCart, settleAnimations, test } from "./fixtures";

/**
 * Layout checks (brief §10, docs/PLAN.md §1, §10 and §15): no horizontal
 * scroll on any route at 390 and 1440 px, a real 404 for unknown URLs, and on
 * phones the email pill never overlaps the sticky add-to-cart.
 */

/** The routes of docs/PLAN.md §1 (product pages come from the sitemap, so they follow the catalogue). */
const PLAN_ROUTES = [
  "/",
  "/collections/all",
  "/about",
  "/faq",
  "/contact",
  "/shipping-returns",
  "/privacy-policy",
  "/terms-and-conditions",
  "/cookie-policy",
  "/legal-notice",
  "/account",
  "/checkout",
];

const UNKNOWN_PRODUCT = "/products/no-such-scent";
const UNKNOWN_PAGE = "/no-such-page";

async function productPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>[^<]*?(\/products\/[^<]+)<\/loc>/g)].map((match) => match[1]);
  // Six scents, the Discovery Set, the Travel Pouch and the e-gift card.
  expect(paths).toHaveLength(9);
  return paths;
}

async function horizontalOverflow(page: Page): Promise<{ scrollWidth: number; viewport: number }> {
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.viewportSize()?.width ?? 0;
  const scrollWidth = await page.evaluate(() =>
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  );
  return { scrollWidth, viewport };
}

test("no route scrolls horizontally", async ({ page, request }) => {
  test.slow(); // 23 pages in one test.
  const routes = [...PLAN_ROUTES, ...(await productPaths(request))];

  for (const path of routes) {
    await gotoHydrated(page, path);
    const { scrollWidth, viewport } = await horizontalOverflow(page);
    expect.soft(scrollWidth, `${path}: scrollWidth ${scrollWidth} > ${viewport}`).toBeLessThanOrEqual(viewport);
    expect.soft(await page.evaluate(() => window.innerWidth), `${path}: layout viewport`).toBe(viewport);
  }

  for (const path of [UNKNOWN_PRODUCT, UNKNOWN_PAGE]) {
    await gotoHydrated(page, path, { status: 404 });
    const { scrollWidth, viewport } = await horizontalOverflow(page);
    expect.soft(scrollWidth, `${path}: scrollWidth ${scrollWidth} > ${viewport}`).toBeLessThanOrEqual(viewport);
  }
});

for (const path of [UNKNOWN_PRODUCT, UNKNOWN_PAGE]) {
  test(`${path} shows the 404 page with status 404`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/not found/i);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("Wrong direction.");
    await expect(page.getByRole("main").getByRole("link", { name: "Shop the range" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Read the FAQ" })).toBeVisible();
  });
}

test.describe("mobile product page", () => {
  test.use({ reducedMotion: "reduce" }); // No slide-ins: boxes are final as soon as they show.

  test("the email pill and the sticky add-to-cart never overlap", async ({ page, isMobile }) => {
    test.skip(!isMobile, "The sticky add-to-cart only exists below lg.");

    await gotoHydrated(page, "/products/north-swell");
    const sticky = page.locator('[role="region"][aria-label="Quick add to cart"]');
    const pill = page.locator("div[data-email-pill]");

    /** At the current scroll position: if both show, their boxes do not touch. */
    async function expectNoOverlap(where: string) {
      await settleAnimations(page);
      if (!(await sticky.isVisible()) || !(await pill.isVisible())) return;
      const [stickyBox, pillBox] = await Promise.all([sticky.boundingBox(), pill.boundingBox()]);
      expect(stickyBox && pillBox && boxesOverlap(stickyBox, pillBox), where).toBe(false);
    }

    // Scrolled a little, main button still below: no sticky bar. The capture is mounted and has
    // revealed its pill (240 px), but keeps it hidden on product pages below lg.
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(240);
    await expect(sticky).toBeHidden();
    await expect(pill).toBeAttached();
    await expect(pill).toBeHidden();
    await expectNoOverlap("near the top");

    // Past the main Add to cart button: the sticky bar shows, the pill stays out of the way.
    const buttonBottom = await mainAddToCart(page).evaluate((button) => button.getBoundingClientRect().bottom + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y), buttonBottom + 200);
    await expect(page.getByRole("region", { name: "Quick add to cart" })).toBeVisible();
    await expect(page.locator("body")).toHaveAttribute("data-sticky-atc", "true");
    await expect(pill).toBeHidden();
    await expectNoOverlap("past the main button");

    // Further down and at the very end of the page.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await expect(sticky).toBeVisible();
    await expectNoOverlap("halfway");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(sticky).toBeVisible();
    await expectNoOverlap("at the end");

    // The sticky bar never covers the end of the footer: the body is padded by its height.
    const stickyBox = await sticky.boundingBox();
    const footerBox = await page.getByRole("contentinfo").boundingBox();
    expect(stickyBox && footerBox && footerBox.y + footerBox.height <= stickyBox.y + 1).toBe(true);
  });
});
