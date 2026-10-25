import { describe, expect, it } from "vitest";

import { offers } from "@/content/offers";
import { findProduct } from "@/lib/catalog";
import { localCommerce } from "@/lib/commerce/local";
import {
  absoluteUrl,
  centsToDecimal,
  DISALLOWED_PATHS,
  formatNotes,
  homeJsonLd,
  NOINDEX_PATHS,
  organizationJsonLd,
  pageMetadata,
  productJsonLd,
  productMetadata,
  productPageJsonLd,
  serializeJsonLd,
  STATIC_ROUTES,
} from "@/lib/seo";
import type { Product, Review } from "@/lib/types";

const products = await localCommerce.getProducts();

function product(slug: string): Product {
  const found = findProduct(products, slug);
  if (!found) throw new Error(`Missing product ${slug}`);
  return found;
}

/** Test fixtures only: the site has no reviews (brief §2.2). */
const sampleReviews: Review[] = [
  {
    id: "r1",
    productSlug: "north-swell",
    author: "Test A",
    rating: 5,
    title: "Fixture",
    body: "Fixture body.",
    date: "2026-11-02",
    verifiedPurchase: true,
    source: "test",
  },
  {
    id: "r2",
    productSlug: "north-swell",
    author: "Test B",
    rating: 4,
    title: "Fixture",
    body: "Fixture body.",
    date: "2026-11-01",
    verifiedPurchase: true,
    source: "test",
  },
];

describe("helpers", () => {
  it("formats cents as a schema.org decimal", () => {
    expect(centsToDecimal(2495)).toBe("24.95");
    expect(centsToDecimal(500)).toBe("5.00");
    expect(centsToDecimal(5)).toBe("0.05");
    expect(centsToDecimal(0)).toBe("0.00");
  });

  it("makes absolute URLs on the site origin", () => {
    expect(absoluteUrl("/products/north-swell")).toMatch(/^https?:\/\/[^/]+\/products\/north-swell$/);
  });

  it("formats notes per group, capitalised", () => {
    expect(formatNotes({ top: ["sea salt", "bergamot"], heart: ["sage"], base: ["white cedar"] })).toBe(
      "Sea salt, bergamot · Sage · White cedar",
    );
  });

  it("escapes < so the JSON cannot close its script element", () => {
    const out = serializeJsonLd({ "@context": "https://schema.org", "@graph": [{ "@type": "Thing", name: "</script><b>" }] });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)["@graph"][0].name).toBe("</script><b>");
  });

  it("keeps checkout and account out of the static routes", () => {
    expect(STATIC_ROUTES).not.toContain("/checkout");
    expect(STATIC_ROUTES).not.toContain("/account");
  });

  it("never blocks a noindex page in robots.txt, so crawlers can read its noindex", () => {
    for (const path of NOINDEX_PATHS) {
      expect(DISALLOWED_PATHS.some((blocked) => path.startsWith(blocked))).toBe(false);
    }
    expect(DISALLOWED_PATHS).toContain("/api/");
  });
});

describe("metadata", () => {
  it("sets canonical, Open Graph url, site name, locale and image", () => {
    const meta = pageMetadata({ title: "About", description: "d", path: "/about" });
    expect(meta.alternates?.canonical).toBe("/about");
    expect(meta.openGraph).toMatchObject({ url: "/about", siteName: "CORVANE", locale: "en_GB", type: "website" });
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })]);
    expect(meta.robots).toBeUndefined();
  });

  it("gives every product its title, canonical and own image", () => {
    for (const item of products) {
      const meta = productMetadata(item);
      expect(meta.title).toBe(item.seo.title);
      expect(meta.description).toBe(item.seo.description);
      expect(meta.alternates?.canonical).toBe(`/products/${item.slug}`);
      expect(meta.openGraph?.images).toEqual([
        expect.objectContaining({ url: `/products/${item.slug}/opengraph-image`, alt: expect.any(String) }),
      ]);
    }
  });
});

describe("JSON-LD", () => {
  it("describes a stick with one Offer at the single-stick price", () => {
    const node = productJsonLd(product("north-swell"), { reviews: [] });
    expect(node).toMatchObject({
      "@type": "Product",
      name: "North Swell",
      sku: "north-swell",
      brand: { "@type": "Brand", name: "CORVANE" },
      offers: {
        "@type": "Offer",
        price: centsToDecimal(offers.stickPricing[1]),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    });
    expect(node.image).toEqual([expect.stringMatching(/\/products\/north-swell\/opengraph-image$/)]);
  });

  it("has no rating or reviews without real reviews", () => {
    for (const item of products) {
      const node = productJsonLd(item);
      expect(node).not.toHaveProperty("aggregateRating");
      expect(node).not.toHaveProperty("review");
    }
  });

  it("adds aggregateRating and review once reviews exist", () => {
    const node = productJsonLd(product("north-swell"), { reviews: sampleReviews });
    expect(node.aggregateRating).toMatchObject({ "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 2 });
    expect(node.review).toHaveLength(2);
    expect(productJsonLd(product("drift-and-ember"), { reviews: sampleReviews })).not.toHaveProperty("aggregateRating");
  });

  it("uses an AggregateOffer without shipping for the gift card", () => {
    const amounts = [...offers.giftCardDenominations].sort((a, b) => a - b);
    expect(productJsonLd(product("e-gift-card")).offers).toEqual(
      expect.objectContaining({
        "@type": "AggregateOffer",
        lowPrice: centsToDecimal(amounts[0]),
        highPrice: centsToDecimal(amounts[amounts.length - 1]),
        offerCount: amounts.length,
        priceCurrency: "EUR",
      }),
    );
    expect(productJsonLd(product("e-gift-card")).offers).not.toHaveProperty("shippingDetails");
  });

  it("adds shipping per country to physical products", () => {
    const offer = productJsonLd(product("discovery-set")).offers as { shippingDetails: unknown[] };
    expect(offer.shippingDetails).toHaveLength(2);
  });

  it("puts Product and BreadcrumbList on a product page", () => {
    const doc = productPageJsonLd(product("north-swell"));
    expect(doc["@graph"].map((node) => node["@type"])).toEqual(["Product", "BreadcrumbList"]);
    const crumbs = doc["@graph"][1].itemListElement as { position: number; name: string }[];
    expect(crumbs.map((crumb) => crumb.name)).toEqual(["Home", "Shop", "North Swell"]);
  });

  it("puts Organization and WebSite on the homepage, without placeholder socials", () => {
    expect(homeJsonLd()["@graph"].map((node) => node["@type"])).toEqual(["Organization", "WebSite"]);
    expect(organizationJsonLd()).not.toHaveProperty("sameAs");
  });
});
