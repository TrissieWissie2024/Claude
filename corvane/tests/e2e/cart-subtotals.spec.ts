import { addFromProductPage, cartButton, drawerSubtotal, expect, test } from "./fixtures";

/**
 * The cart subtotal for 1, 2, 3, 4 and 7 one-time sticks (brief §7, docs/PLAN.md
 * §7 and §15): sticks are grouped per plan into sets of 3 (€59.95), with a
 * remainder of 2 (€44.95) or 1 (€24.95). Driven through the UI: one stick added
 * on the product page, then the drawer's quantity stepper.
 */

const expected: [sticks: number, subtotal: string][] = [
  [1, "€24.95"],
  [2, "€44.95"],
  [3, "€59.95"],
  [4, "€84.90"],
  [7, "€144.85"],
];

for (const [sticks, subtotal] of expected) {
  test(`${sticks} one-time stick${sticks === 1 ? "" : "s"}: subtotal ${subtotal}`, async ({ page }) => {
    const drawer = await addFromProductPage(page, "north-swell");
    const stepper = drawer.getByRole("group", { name: "Quantity of North Swell" });
    const increase = drawer.getByRole("button", { name: "Increase quantity of North Swell" });
    await expect(stepper).toHaveText("1");

    for (let quantity = 2; quantity <= sticks; quantity += 1) {
      await increase.click();
      await expect(stepper).toHaveText(String(quantity));
    }

    await expect(drawerSubtotal(drawer)).toHaveText(subtotal);
    const items = sticks === 1 ? "1 item" : `${sticks} items`;
    await expect(drawer).toContainText(items);

    // Closed, the header counts every stick.
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(cartButton(page)).toHaveAccessibleName(`Cart, ${items}`);
  });
}
