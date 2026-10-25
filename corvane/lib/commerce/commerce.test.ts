import { describe, expect, it } from "vitest";

import { commerce, resolveCommerceProviderName } from "@/lib/commerce";
import { localCommerce } from "@/lib/commerce/local";
import {
  getShopifyConfig,
  shopifyCommerce,
  ShopifyNotConfiguredError,
  toShopifyCartInput,
} from "@/lib/commerce/shopify";
import type { Product } from "@/lib/types";

describe("provider selection", () => {
  it("defaults to local", () => {
    expect(resolveCommerceProviderName(undefined)).toBe("local");
    expect(resolveCommerceProviderName("")).toBe("local");
    expect(resolveCommerceProviderName(" Shopify ")).toBe("shopify");
    expect(commerce.name).toBe("local");
  });
});

describe("local provider", () => {
  it("returns the catalog and a demo checkout", async () => {
    const products = await localCommerce.getProducts();
    expect(products).toHaveLength(9);
    expect((await localCommerce.getProduct("lantern-smoke"))?.name).toBe("Lantern Smoke");
    expect(await localCommerce.getProduct("missing")).toBeNull();
    await expect(localCommerce.createCheckout({ lines: [], discountCode: null, country: "NL" })).resolves.toEqual({
      checkoutUrl: "/checkout",
      provider: "local",
    });
  });

  it("hands out a copy of the product list", async () => {
    const first = await localCommerce.getProducts();
    first.pop();
    expect(await localCommerce.getProducts()).toHaveLength(9);
  });
});

describe("shopify stub", () => {
  it("throws a clear not-configured error", async () => {
    await expect(shopifyCommerce.getProducts()).rejects.toBeInstanceOf(ShopifyNotConfiguredError);
    await expect(shopifyCommerce.getProduct("north-swell")).rejects.toThrow(/SHOPIFY_STORE_DOMAIN/);
    await expect(shopifyCommerce.createCheckout({ lines: [], discountCode: null, country: "NL" })).rejects.toThrow(
      /not configured/,
    );
  });

  it("reads its environment", () => {
    expect(getShopifyConfig({})).toBeNull();
    expect(getShopifyConfig({ SHOPIFY_STORE_DOMAIN: "x.myshopify.com", SHOPIFY_STOREFRONT_TOKEN: "t" })).toEqual({
      storeDomain: "x.myshopify.com",
      storefrontToken: "t",
      apiVersion: "2026-10",
    });
  });

  it("maps cart lines to Storefront cart lines", () => {
    const stick = (slug: string): Product => ({
      slug,
      name: slug,
      kind: "stick",
      family: "Fresh",
      notes: { top: [], heart: [], base: [] },
      ringColor: "#000000",
      intensity: { freshWarm: 1, projection: 1 },
      mood: "",
      tagline: "",
      description: "",
      badges: [],
      featuredRank: 1,
      releasedAt: "2026-10-25",
      seo: { title: "", description: "" },
      externalIds: {
        shopifyVariantIds: { default: `gid://shopify/ProductVariant/${slug}` },
        shopifySellingPlanIds: { 2: "gid://shopify/SellingPlan/2" },
      },
    });
    const input = toShopifyCartInput(
      {
        lines: [{ id: "s", kind: "stick", scents: ["a", "b"], plan: { type: "subscription", intervalMonths: 2 }, quantity: 1 }],
        discountCode: "WELCOME10",
        country: "BE",
      },
      [stick("a"), stick("b")],
    );
    expect(input.lines).toEqual([
      { merchandiseId: "gid://shopify/ProductVariant/a", quantity: 1, sellingPlanId: "gid://shopify/SellingPlan/2", attributes: [{ key: "_set", value: "s" }] },
      { merchandiseId: "gid://shopify/ProductVariant/b", quantity: 1, sellingPlanId: "gid://shopify/SellingPlan/2", attributes: [{ key: "_set", value: "s" }] },
    ]);
    expect(input.discountCodes).toEqual(["WELCOME10"]);
    expect(input.buyerIdentity).toEqual({ countryCode: "BE" });
    expect(() =>
      toShopifyCartInput({ lines: [{ id: "p", kind: "pouch", slug: "travel-pouch", quantity: 1 }], discountCode: null, country: "NL" }, []),
    ).toThrow(ShopifyNotConfiguredError);
  });
});
