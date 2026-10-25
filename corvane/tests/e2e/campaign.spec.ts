import { offers } from "@/content/offers";
import { site } from "@/content/site";

import {
  AFTER_CAMPAIGN,
  CAMPAIGN_ENDS_AT,
  DURING_CAMPAIGN,
  SECOND,
  expect,
  expectClientClockRead,
  promoBar,
  test,
} from "./fixtures";

/**
 * The campaign bar (brief §2.3, docs/PLAN.md §8): a countdown only to the fixed
 * offers.campaign.endsAt. From endsAt on the bar is gone and the USP bar shows
 * in its place, also when endsAt passes while the page is open.
 */

const { campaign } = offers;

/** Text that only the campaign message renders. */
const campaignOnly = [campaign.code ?? "LAUNCH15", site.promoBar.endsIn];

test("before endsAt the campaign bar shows its code and the countdown", async ({ page }) => {
  await page.clock.setFixedTime(DURING_CAMPAIGN);
  await page.goto("/");

  const bar = promoBar(page);
  await expect(bar.getByText(site.promoBar.endsIn)).toBeVisible();
  // 2 days, 5 hours and 30 minutes left: days and hours while more than a day is left.
  await expect(bar.getByText("2d 5h", { exact: true })).toBeVisible();
  await expect(bar.getByText(campaign.code ?? "LAUNCH15", { exact: true })).toBeVisible();
  await expect(bar).toContainText(campaign.message);
  await expect(bar.getByRole("button", { name: site.promoBar.pauseCountdown })).toBeVisible();
});

test("after endsAt the campaign bar is gone and the USP bar shows", async ({ page }) => {
  expect(AFTER_CAMPAIGN.getTime()).toBeGreaterThan(CAMPAIGN_ENDS_AT);
  await page.clock.setFixedTime(AFTER_CAMPAIGN);
  await page.goto("/");

  // The USP bar is also what renders before mount, so first make sure the page read the clock.
  await expectClientClockRead(page);

  const bar = promoBar(page);
  for (const text of campaignOnly) await expect(bar).not.toContainText(text);
  for (const usp of site.usps) await expect(bar).toContainText(usp.text);
  await expect(bar.locator("time")).toHaveCount(0);
});

test("the campaign bar disappears by itself when endsAt passes while the page is open", async ({ page }) => {
  // Three seconds before the end, paused there while the page loads (however long that takes).
  await page.clock.install({ time: CAMPAIGN_ENDS_AT - 3 * SECOND });
  await page.clock.pauseAt(CAMPAIGN_ENDS_AT - 3 * SECOND);
  await page.goto("/");

  const bar = promoBar(page);
  await expect(bar.getByText(site.promoBar.endsIn)).toBeVisible();
  // The final 24 hours count down in hours, minutes and seconds.
  await expect(bar.getByText("00:00:03", { exact: true })).toBeVisible();

  await page.clock.runFor(5 * SECOND);

  // No reload: the next tick of the bar's clock switches it to the USP bar.
  for (const text of campaignOnly) await expect(bar).not.toContainText(text);
  for (const usp of site.usps) await expect(bar).toContainText(usp.text);
  await expect(bar.getByRole("button", { name: site.promoBar.pauseCountdown })).toHaveCount(0);
});
