import { offers } from "@/content/offers";
import { site } from "@/content/site";

import { addFromProductPage, cartButton, cartDrawer, expect, gotoHydrated, test } from "./fixtures";

/**
 * The popup's reward is real (brief §2.8, docs/PLAN.md §10 point 6): the code
 * it shows (offers.welcomeCode, WELCOME10, 10%) applied from the popup takes
 * 10% off in the cart drawer and on /checkout. The pricing itself is covered
 * by lib/pricing.test.ts (2495 -> 250, D09).
 *
 * Uses the fixtures `test`, so the popup never opens on its own here; the pill
 * opens it, as a visitor would.
 */

const copy = site.emailCapture;

test("WELCOME10 from the popup takes 10% off in the cart drawer and at checkout", async ({ page }) => {
  // One stick in the cart: €24.95, so 10% is €2.50 (rounded half up).
  const drawer = await addFromProductPage(page, "north-swell");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  // Open the popup from the pill on the homepage, turn a card, leave an email, get the code.
  await gotoHydrated(page, "/");
  await page.mouse.wheel(0, 400);
  const pill = page.locator("div[data-email-pill]").getByRole("button", { name: new RegExp(`^${copy.pillLabel}`) });
  await expect(pill).toBeVisible();
  await pill.click();
  await expect(page.getByRole("dialog", { name: copy.title })).toBeVisible();
  // The title changes once a card is turned, so from here on the dialog is found without its name.
  const popup = page.getByRole("dialog");
  await popup.getByRole("button", { name: copy.card(1, 3) }).click();
  await expect(page.getByRole("dialog", { name: copy.titleChosen })).toBeVisible();
  await popup.getByLabel(copy.emailLabel).fill("visitor@example.com");
  await popup.getByRole("button", { name: copy.submit }).click();

  const codeDialog = page.getByRole("dialog", { name: copy.successHeading });
  await expect(codeDialog).toContainText(offers.welcomeCode);
  await codeDialog.getByRole("button", { name: copy.applyToCart }).click();
  await expect(codeDialog).toContainText(copy.applied(offers.welcomeCode));
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Cart drawer: the code row takes off €2.50.
  await cartButton(page).click();
  const cart = cartDrawer(page);
  await expect(cart).toBeVisible();
  const codeValue = cart
    .locator("dt", { hasText: `Code ${offers.welcomeCode}` })
    .locator("xpath=following-sibling::dd[1]");
  await expect(codeValue).toHaveText("−€2.50");
  await page.keyboard.press("Escape");

  // Checkout: the same code and the same amount.
  await gotoHydrated(page, "/checkout");
  const summary = page.getByRole("main");
  await expect(summary).toContainText(`Code ${offers.welcomeCode}`);
  await expect(summary).toContainText("−€2.50");
});
