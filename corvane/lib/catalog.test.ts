import { describe, expect, it } from "vitest";

import { offers } from "@/content/offers";
import { getCartAnalytics, getLineAnalytics, getProductAnalytics, track } from "@/lib/analytics";
import {
  filterByFamily,
  findProduct,
  findStick,
  getCardNotes,
  getFamilies,
  getFromPrice,
  getScentNames,
  getSticks,
  hasFromPrice,
  isSortKey,
  isStick,
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  parseCartLine,
  parseCartLines,
  parseFamily,
  parseSortKey,
  sortProducts,
} from "@/lib/catalog";
import { localCommerce } from "@/lib/commerce/local";
import { priceCart } from "@/lib/pricing";
import type { CartLine, Product } from "@/lib/types";

const products = await localCommerce.getProducts();

function slugs(list: readonly Product[]): string[] {
  return list.map((product) => product.slug);
}

describe("lookups", () => {
  it("finds products and sticks by slug", () => {
    expect(findProduct(products, "north-swell")?.name).toBe("North Swell");
    expect(findProduct(products, "nope")).toBeNull();
    expect(findStick(products, "dune-fig")?.family).toBe("Green");
    expect(findStick(products, "discovery-set")).toBeNull();
  });

  it("lists the six sticks and their families", () => {
    const sticks = getSticks(products);
    expect(sticks).toHaveLength(6);
    expect(sticks.every(isStick)).toBe(true);
    expect(getFamilies(products)).toEqual(["Fresh", "Woody", "Dark", "Green", "Citrus", "Aromatic"]);
  });

  it("picks the first top, heart and base note for cards", () => {
    const stick = findStick(products, "drift-and-ember");
    expect(stick && getCardNotes(stick)).toEqual(["pink pepper", "driftwood", "smoked vetiver"]);
  });
});

describe("prices", () => {
  it("uses offers.ts for every kind", () => {
    expect(getFromPrice(findProduct(products, "north-swell")!)).toBe(offers.stickPricing[1]);
    expect(getFromPrice(findProduct(products, "discovery-set")!)).toBe(2995);
    expect(getFromPrice(findProduct(products, "travel-pouch")!)).toBe(995);
    expect(getFromPrice(findProduct(products, "e-gift-card")!)).toBe(2500);
    expect(hasFromPrice(findProduct(products, "e-gift-card")!)).toBe(true);
    expect(hasFromPrice(findProduct(products, "north-swell")!)).toBe(false);
  });
});

describe("sorting and filtering", () => {
  it("sorts featured by featuredRank without mutating the input", () => {
    const reversed = [...products].reverse();
    const before = slugs(reversed);
    expect(slugs(sortProducts(reversed, "featured"))).toEqual(slugs(products));
    expect(slugs(reversed)).toEqual(before);
  });

  it("sorts by price with ties on featuredRank", () => {
    expect(slugs(sortProducts(products, "price-asc"))).toEqual([
      "travel-pouch",
      "north-swell",
      "drift-and-ember",
      "lantern-smoke",
      "iron-coast",
      "dune-fig",
      "harbour-tea",
      "e-gift-card",
      "discovery-set",
    ]);
    const desc = slugs(sortProducts(products, "price-desc"));
    expect(desc[0]).toBe("discovery-set");
    expect(desc.slice(2, 8)).toEqual(["north-swell", "drift-and-ember", "lantern-smoke", "iron-coast", "dune-fig", "harbour-tea"]);
    expect(desc[8]).toBe("travel-pouch");
  });

  it("sorts newest first, ties on featuredRank", () => {
    const withNewer = products.map((product) =>
      product.slug === "harbour-tea" ? { ...product, releasedAt: "2027-01-01" } : product,
    );
    const sorted = slugs(sortProducts(withNewer, "newest"));
    expect(sorted[0]).toBe("harbour-tea");
    expect(sorted.slice(1)).toEqual(slugs(products).filter((slug) => slug !== "harbour-tea"));
  });

  it("filters to the sticks of one family", () => {
    expect(slugs(filterByFamily(products, "Woody"))).toEqual(["drift-and-ember"]);
    expect(filterByFamily(products, null)).toHaveLength(products.length);
  });

  it("parses search params", () => {
    expect(parseSortKey("price-desc")).toBe("price-desc");
    expect(parseSortKey("cheap")).toBe("featured");
    expect(parseSortKey(null)).toBe("featured");
    expect(parseFamily("woody")).toBe("Woody");
    expect(parseFamily("spicy")).toBeNull();
  });
});

describe("cart line validation", () => {
  it("keeps valid lines and strips unknown fields", () => {
    const line = parseCartLine(
      { id: "a", kind: "stick", scents: ["north-swell", "dune-fig"], plan: { type: "subscription", intervalMonths: 2 }, quantity: 2, price: 1 },
      products,
    );
    expect(line).toEqual({
      id: "a",
      kind: "stick",
      scents: ["north-swell", "dune-fig"],
      plan: { type: "subscription", intervalMonths: 2 },
      quantity: 2,
    });
  });

  it("drops malformed lines", () => {
    const lines = parseCartLines(
      [
        null,
        "x",
        { id: "1", kind: "stick", scents: [], plan: { type: "one-time" }, quantity: 1 },
        { id: "2", kind: "stick", scents: ["a", "b", "c", "d"], plan: { type: "one-time" }, quantity: 1 },
        { id: "3", kind: "stick", scents: ["unknown"], plan: { type: "one-time" }, quantity: 1 },
        { id: "4", kind: "stick", scents: ["north-swell"], plan: { type: "subscription", intervalMonths: 6 }, quantity: 1 },
        { id: "5", kind: "stick", scents: ["north-swell"], plan: { type: "one-time" }, quantity: 0 },
        { id: "6", kind: "stick", scents: ["north-swell"], plan: { type: "one-time" }, quantity: 1.5 },
        { id: "7", kind: "gift-card", slug: "e-gift-card", amount: 1234, quantity: 1 },
        { id: "8", kind: "pouch", slug: "discovery-set", quantity: 1 },
        { kind: "pouch", slug: "travel-pouch", quantity: 1 },
        { id: "ok", kind: "gift-card", slug: "e-gift-card", amount: 5000, quantity: 1 },
      ],
      products,
    );
    expect(lines.map((line) => line.id)).toEqual(["ok"]);
    expect(parseCartLines({ lines: [] }, products)).toEqual([]);
  });
});

describe("analytics payloads", () => {
  it("values a stick set at its tile price", () => {
    const payload = getLineAnalytics(
      { kind: "stick", scents: ["north-swell", "dune-fig", "iron-coast"], plan: { type: "one-time" }, quantity: 2 },
      products,
    );
    expect(payload.value).toBe(2 * 5995);
    expect(payload.items.map((item) => [item.item_id, item.price, item.quantity])).toEqual([
      ["north-swell", 1998, 2],
      ["dune-fig", 1998, 2],
      ["iron-coast", 1998, 2],
    ]);
  });

  it("uses the pricing summary for begin_checkout", () => {
    const lines: CartLine[] = [
      { id: "a", kind: "stick", scents: ["north-swell"], plan: { type: "one-time" }, quantity: 3 },
      { id: "b", kind: "gift-card", slug: "e-gift-card", amount: 2500, quantity: 1 },
    ];
    const summary = priceCart({ lines, discountCode: "WELCOME10", now: new Date("2026-10-26T12:00:00+01:00") });
    const payload = getCartAnalytics(lines, products, summary);
    expect(payload.value).toBe(summary.subtotal);
    expect(payload.coupon).toBe("WELCOME10");
    expect(payload.items).toHaveLength(2);
  });

  it("describes a product for view_item", () => {
    expect(getProductAnalytics(findProduct(products, "e-gift-card")!).value).toBe(2500);
  });

  it("is a no-op on the server", () => {
    expect(() => track("sign_up", { method: "newsletter" })).not.toThrow();
  });
});

/* ------------------------------------------------------------------ */
/* Edge cases (phase 9 coverage audit)                                 */
/* ------------------------------------------------------------------ */

describe("prices with other gift card configs", () => {
  const giftCard = () => findProduct(products, "e-gift-card")!;

  it("is 0 and not a From price without denominations, a plain price with one", () => {
    expect(getFromPrice(giftCard(), { ...offers, giftCardDenominations: [] })).toBe(0);
    expect(hasFromPrice(giftCard(), { ...offers, giftCardDenominations: [] })).toBe(false);
    expect(getFromPrice(giftCard(), { ...offers, giftCardDenominations: [7500] })).toBe(7500);
    expect(hasFromPrice(giftCard(), { ...offers, giftCardDenominations: [7500] })).toBe(false);
    // Lowest, whatever the order in the config.
    expect(getFromPrice(giftCard(), { ...offers, giftCardDenominations: [10000, 2500, 5000] })).toBe(2500);
  });
});

describe("sort ties and search params", () => {
  it("breaks featuredRank ties on the slug, both ways", () => {
    const tied = products.map((product) => ({ ...product, featuredRank: 1 }));
    const sorted = slugs(sortProducts([...tied].reverse(), "featured"));
    expect(sorted).toEqual([...sorted].sort());
    expect(slugs(sortProducts(tied, "featured"))).toEqual(sorted);
  });

  it("sorts newest first with older products last", () => {
    const dated = products.map((product) =>
      product.slug === "north-swell"
        ? { ...product, releasedAt: "2026-01-01" }
        : product.slug === "dune-fig"
          ? { ...product, releasedAt: "2027-06-01" }
          : product,
    );
    const sorted = slugs(sortProducts(dated, "newest"));
    expect(sorted[0]).toBe("dune-fig");
    expect(sorted[sorted.length - 1]).toBe("north-swell");
    // Same result whatever the input order.
    expect(slugs(sortProducts([...dated].reverse(), "newest"))).toEqual(sorted);
  });

  it("treats duplicate entries as equal", () => {
    const stick = findProduct(products, "north-swell")!;
    expect(slugs(sortProducts([stick, stick], "featured"))).toEqual(["north-swell", "north-swell"]);
  });

  it("falls back to featured for an unknown sort key at runtime", () => {
    expect(slugs(sortProducts([...products].reverse(), "cheapest" as never))).toEqual(slugs(products));
  });

  it("accepts only known sort keys and families", () => {
    expect(isSortKey("newest")).toBe(true);
    expect(isSortKey(3)).toBe(false);
    expect(parseSortKey(undefined)).toBe("featured");
    expect(parseFamily(null)).toBeNull();
    expect(parseFamily(undefined)).toBeNull();
    expect(parseFamily("")).toBeNull();
    expect(parseFamily("  DARK ")).toBe("Dark");
  });

  it("returns no products for a family without sticks", () => {
    const withoutWoody = products.filter((product) => !(isStick(product) && product.family === "Woody"));
    expect(filterByFamily(withoutWoody, "Woody")).toEqual([]);
    expect(getFamilies(withoutWoody)).not.toContain("Woody");
  });
});

describe("cart line validation, every kind", () => {
  const oneTime = { type: "one-time" };

  it("accepts each kind with its own slug", () => {
    expect(parseCartLine({ id: "d", kind: "discovery-set", slug: "discovery-set", quantity: 2 }, products)).toEqual({
      id: "d",
      kind: "discovery-set",
      slug: "discovery-set",
      quantity: 2,
    });
    expect(parseCartLine({ id: "p", kind: "pouch", slug: "travel-pouch", quantity: 1, extra: true }, products)).toEqual({
      id: "p",
      kind: "pouch",
      slug: "travel-pouch",
      quantity: 1,
    });
    expect(parseCartLine({ id: "g", kind: "gift-card", slug: "e-gift-card", amount: 10000, quantity: 1 }, products)).toEqual({
      id: "g",
      kind: "gift-card",
      slug: "e-gift-card",
      amount: 10000,
      quantity: 1,
    });
    expect(
      parseCartLine({ id: "s", kind: "stick", scents: ["north-swell", "north-swell"], plan: oneTime, quantity: 1 }, products),
    ).toMatchObject({ scents: ["north-swell", "north-swell"], plan: { type: "one-time" } });
  });

  it("rejects a kind with the wrong slug or a product missing from the catalog", () => {
    expect(parseCartLine({ id: "d", kind: "discovery-set", slug: "travel-pouch", quantity: 1 }, products)).toBeNull();
    expect(parseCartLine({ id: "g", kind: "gift-card", slug: "gift", amount: 5000, quantity: 1 }, products)).toBeNull();
    expect(parseCartLine({ id: "g", kind: "gift-card", slug: "e-gift-card", amount: "5000", quantity: 1 }, products)).toBeNull();
    const sticksOnly = getSticks(products);
    expect(parseCartLine({ id: "d", kind: "discovery-set", slug: "discovery-set", quantity: 1 }, sticksOnly)).toBeNull();
    expect(parseCartLine({ id: "p", kind: "pouch", slug: "travel-pouch", quantity: 1 }, sticksOnly)).toBeNull();
    expect(parseCartLine({ id: "g", kind: "gift-card", slug: "e-gift-card", amount: 5000, quantity: 1 }, sticksOnly)).toBeNull();
  });

  it("rejects unknown kinds, bad ids and quantities outside 1 to 99", () => {
    const pouch = { id: "p", kind: "pouch", slug: "travel-pouch", quantity: 1 };
    expect(parseCartLine({ ...pouch, kind: "candle" }, products)).toBeNull();
    expect(parseCartLine({ ...pouch, id: "" }, products)).toBeNull();
    expect(parseCartLine({ ...pouch, id: 7 }, products)).toBeNull();
    expect(parseCartLine({ ...pouch, id: "x".repeat(201) }, products)).toBeNull();
    expect(parseCartLine({ ...pouch, id: "x".repeat(200) }, products)).not.toBeNull();
    expect(parseCartLine({ ...pouch, quantity: MAX_LINE_QUANTITY }, products)).not.toBeNull();
    expect(parseCartLine({ ...pouch, quantity: MAX_LINE_QUANTITY + 1 }, products)).toBeNull();
    expect(parseCartLine({ ...pouch, quantity: "1" }, products)).toBeNull();
    expect(parseCartLine([pouch], products)).toBeNull();
    expect(parseCartLine(undefined, products)).toBeNull();
  });

  it("rejects plans that are missing, unknown or not an object", () => {
    const line = { id: "s", kind: "stick", scents: ["north-swell"], quantity: 1 };
    expect(parseCartLine(line, products)).toBeNull();
    expect(parseCartLine({ ...line, plan: "one-time" }, products)).toBeNull();
    expect(parseCartLine({ ...line, plan: { type: "weekly" } }, products)).toBeNull();
    expect(parseCartLine({ ...line, plan: { type: "subscription" } }, products)).toBeNull();
    expect(parseCartLine({ ...line, plan: { type: "subscription", intervalMonths: "2" } }, products)).toBeNull();
    expect(parseCartLine({ ...line, plan: { type: "subscription", intervalMonths: 3, extra: 1 } }, products)).toMatchObject({
      plan: { type: "subscription", intervalMonths: 3 },
    });
    expect(parseCartLine({ ...line, scents: "north-swell", plan: oneTime }, products)).toBeNull();
    expect(parseCartLine({ ...line, scents: ["discovery-set"], plan: oneTime }, products)).toBeNull();
  });

  it("does not share the scents array with the input", () => {
    const scents = ["north-swell"];
    const line = parseCartLine({ id: "s", kind: "stick", scents, plan: oneTime, quantity: 1 }, products);
    expect(line?.kind === "stick" && line.scents).toEqual(scents);
    expect(line?.kind === "stick" && line.scents !== scents).toBe(true);
  });

  it(`keeps at most ${MAX_CART_LINES} valid lines`, () => {
    const many = Array.from({ length: MAX_CART_LINES + 5 }, (_, index) => ({
      id: `line-${index}`,
      kind: "pouch",
      slug: "travel-pouch",
      quantity: 1,
    }));
    const lines = parseCartLines([null, ...many], products);
    expect(lines).toHaveLength(MAX_CART_LINES);
    expect(lines[0].id).toBe("line-0");
    expect(lines[MAX_CART_LINES - 1].id).toBe(`line-${MAX_CART_LINES - 1}`);
  });
});

describe("getScentNames", () => {
  it("names scents in the order chosen and falls back to the slug", () => {
    expect(getScentNames(products, ["dune-fig", "north-swell"])).toEqual(["Dune Fig", "North Swell"]);
    expect(getScentNames(products, ["retired-scent", "discovery-set"])).toEqual(["retired-scent", "discovery-set"]);
    expect(getScentNames(products, [])).toEqual([]);
  });
});
