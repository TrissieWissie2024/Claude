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
  getSticks,
  hasFromPrice,
  isStick,
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
