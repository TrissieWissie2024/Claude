import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Price } from "./Price";

/*
 * Honest prices (brief §2.4, docs/PLAN.md §7 rule 9): Price strikes through a
 * previous price only when the data gives one that declares it was the lowest
 * price of the 30 days before (lowestPriceLast30Days: true) and it is higher
 * than the current price. That declaration is not checked here; it needs a
 * price history (docs/TODO-LAUNCH.md). No product sets previousPrice at launch
 * (content/content-guard.test.ts).
 */

describe("Price", () => {
  it("renders no struck-through price without previousPrice", () => {
    const html = renderToStaticMarkup(<Price amount={2495} />);
    expect(html).toContain("€24.95");
    expect(html).not.toMatch(/<s[\s>]|<del[\s>]|line-through/);
    expect(html).not.toContain("Previous price");
  });

  it("strikes through a declared previous price that is higher than the current price", () => {
    const html = renderToStaticMarkup(<Price amount={2495} previousPrice={{ amount: 2995, lowestPriceLast30Days: true }} />);
    expect(html).toMatch(/<s[\s>]/);
    expect(html).toContain("€29.95");
    expect(html).toContain("Previous price");
    expect(html).toContain("Current price");
  });

  it("ignores a previous price that is not higher, and one without the 30-day declaration", () => {
    for (const previousPrice of [
      { amount: 2495, lowestPriceLast30Days: true as const },
      { amount: 1995, lowestPriceLast30Days: true as const },
      // A value that bypasses the type (for example from an external source) is ignored as well.
      { amount: 2995, lowestPriceLast30Days: "true" } as unknown as { amount: number; lowestPriceLast30Days: true },
    ]) {
      const html = renderToStaticMarkup(<Price amount={2495} previousPrice={previousPrice} />);
      expect(html).not.toMatch(/<s[\s>]/);
      expect(html).not.toContain("Previous price");
    }
  });
});
