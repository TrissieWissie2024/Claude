import { addFromProductPage, cartButton, cartDrawer, drawerSubtotal, expect, gotoHydrated, test } from "./fixtures";

/** Adding a product works (brief §7, docs/PLAN.md §15). */

test("Add to cart on a product page opens the drawer with the line", async ({ page }) => {
  const drawer = await addFromProductPage(page, "north-swell");

  const lines = drawer.getByRole("list", { name: "Items in your cart" });
  const line = lines.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "North Swell" }) });
  await expect(line).toHaveCount(1);
  await expect(line).toContainText("One-time");
  await expect(line).toContainText("€24.95");
  await expect(line.getByRole("group", { name: "Quantity of North Swell" })).toHaveText("1");

  await expect(drawerSubtotal(drawer)).toHaveText("€24.95");
  await expect(drawer.getByRole("button", { name: "Checkout" })).toBeEnabled();

  // Esc closes the drawer; the header counts the stick.
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 1 item");

  // The cart survives a reload (localStorage).
  await page.reload();
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 1 item");
});

test("a 3-stick set goes into the cart as one line with the free Travel Pouch", async ({ page }) => {
  const drawer = await addFromProductPage(page, "drift-and-ember", { sticks: 3 });

  const lines = drawer.getByRole("list", { name: "Items in your cart" });
  const set = lines.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Set of 3" }) });
  await expect(set).toHaveCount(1);
  await expect(set).toContainText("3 × Drift & Ember");
  await expect(lines.getByRole("heading", { name: /^Travel Pouch/ })).toBeVisible();
  await expect(drawerSubtotal(drawer)).toHaveText("€59.95");
  await page.keyboard.press("Escape");
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 3 items");
});

test("quick add on the collection adds one stick and opens the drawer", async ({ page }) => {
  await gotoHydrated(page, "/collections/all");
  await page.getByRole("button", { name: "Add Lantern Smoke to cart" }).click();

  const drawer = cartDrawer(page);
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Lantern Smoke" })).toBeVisible();
  await expect(drawerSubtotal(drawer)).toHaveText("€24.95");
});
