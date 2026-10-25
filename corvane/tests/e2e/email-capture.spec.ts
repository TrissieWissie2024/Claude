import { expect, test } from "@playwright/test";

/**
 * Email capture (brief §2.8, docs/PLAN.md §10, D52.1): a sign-up through the
 * footer newsletter counts as a sign-up. The popup then never opens on its
 * own again (not on exit intent, not after the 8-second timer, not after the
 * 7-day cooldown) and the pill offers the welcome code instead.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

test("a footer sign-up stops the sign-up window from opening on its own", async ({ page, isMobile }) => {
  await page.clock.install({ time: new Date("2026-10-26T10:00:00+01:00") });
  await page.goto("/about");

  const footer = page.locator("footer");
  await footer.getByLabel("Email address").fill("visitor@example.com");
  await footer.getByRole("button", { name: "Sign up" }).click();
  await expect(footer.getByText("Address checked, but not saved")).toBeVisible();
  await expect(footer).toContainText("WELCOME10");
  await expect(page.locator("div[data-email-pill]")).toContainText("Your 10% code");

  // Leave the field (the popup never interrupts typing), then exit intent on desktop and the timer.
  await page.getByRole("heading", { level: 1 }).click();
  if (!isMobile) {
    await page.mouse.move(700, 200);
    await page.mouse.move(700, -20, { steps: 4 });
  }
  await page.clock.runFor(9_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // After the cooldown, on another page: still nothing.
  await page.clock.fastForward(8 * DAY_MS);
  await page.goto("/");
  await page.clock.runFor(9_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
