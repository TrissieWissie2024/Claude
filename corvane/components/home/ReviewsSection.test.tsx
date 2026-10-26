import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { home } from "@/content/home";
import { pdp } from "@/content/pdp";
import type { Review } from "@/lib/types";

import { ReviewsSection, reviewsHeading } from "./ReviewsSection";

/*
 * Reviews section (brief §2.2; ACM, UCPD art. 7(6) and Annex I point 23b).
 * Launch data renders the empty state, and nothing calls a review verified
 * unless home.reviews.verification says how purchases are checked and the
 * review itself is a checked purchase. Review data here is a test fixture
 * passed through the `source` prop, never content/reviews.ts.
 */

/** Start of the star path in components/ui/Stars.tsx. */
const STAR_PATH = "M12 2.6l2.83";

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function review(overrides: Partial<Review>): Review {
  return {
    id: "fixture-1",
    productSlug: "north-swell",
    author: "Test Person",
    rating: 4,
    title: "Fixture title",
    body: "Fixture body.",
    date: "2026-10-20",
    verifiedPurchase: false,
    source: "test-fixture",
    ...overrides,
  };
}

const CHECK = "Every review is matched to an order before it shows.";

describe("ReviewsSection at launch (content/reviews.ts is empty)", () => {
  it("shows the empty state on the homepage and the product page, with no score, stars, count or verified claim", () => {
    const pages = [
      renderToStaticMarkup(<ReviewsSection />),
      renderToStaticMarkup(
        <ReviewsSection
          productSlug="north-swell"
          eyebrow={pdp.reviews.heading}
          emptyHeading={pdp.reviews.empty.heading}
          emptyBody={pdp.reviews.empty.body}
          variant="inline"
        />,
      ),
    ];
    for (const html of pages) {
      expect(text(html)).toMatch(/No reviews yet/);
      expect(html).not.toContain(STAR_PATH);
      expect(text(html)).not.toMatch(/\d/);
      expect(text(html)).not.toMatch(/verified/i);
    }
  });

  it("keeps the empty-state copy neutral about who reviews", () => {
    expect(home.reviews.empty.body).not.toMatch(/verified|buyer/i);
    expect(pdp.reviews.empty.body).not.toMatch(/verified|buyer/i);
    expect(home.reviews.verification).toBeNull();
  });
});

describe("ReviewsSection with reviews (fixtures)", () => {
  it("uses the neutral heading and says reviews are not checked while no verification is set", () => {
    for (const verifiedPurchase of [false, true]) {
      const html = renderToStaticMarkup(
        <ReviewsSection productSlug="north-swell" variant="inline" source={[review({ verifiedPurchase })]} verification={null} />,
      );
      expect(text(html)).toContain(home.reviews.heading);
      expect(text(html)).toContain(home.reviews.unverifiedNote);
      expect(text(html)).not.toContain(home.reviews.headingVerified);
      expect(text(html)).not.toContain(home.reviews.verifiedBuyer);
      expect(html).toContain(STAR_PATH);
      expect(text(html)).toContain("Fixture title");
    }
  });

  it("uses the neutral heading when one shown review is not a checked purchase", () => {
    const source = [review({ id: "a", verifiedPurchase: true }), review({ id: "b", verifiedPurchase: false, date: "2026-10-21" })];
    const html = renderToStaticMarkup(<ReviewsSection source={source} verification={CHECK} />);
    expect(text(html)).toContain(home.reviews.heading);
    expect(text(html)).not.toContain(home.reviews.headingVerified);
    expect(text(html)).toContain(CHECK);
    // Only the checked review carries the label.
    expect(text(html).split(home.reviews.verifiedBuyer).length - 1).toBe(1);
  });

  it("says 'From verified buyers' only with a verification text and every shown review checked", () => {
    const source = [review({ id: "a", verifiedPurchase: true }), review({ id: "b", verifiedPurchase: true, productSlug: null })];
    const html = renderToStaticMarkup(<ReviewsSection source={source} verification={CHECK} />);
    expect(text(html)).toContain(home.reviews.headingVerified);
    expect(text(html)).toContain(CHECK);
    expect(text(html).split(home.reviews.verifiedBuyer).length - 1).toBe(2);
  });

  it("derives the heading from the data", () => {
    const checked = [review({ verifiedPurchase: true })];
    expect(reviewsHeading(checked, true)).toBe(home.reviews.headingVerified);
    expect(reviewsHeading(checked, false)).toBe(home.reviews.heading);
    expect(reviewsHeading([review({ verifiedPurchase: false })], true)).toBe(home.reviews.heading);
    expect(reviewsHeading([], true)).toBe(home.reviews.heading);
    expect(reviewsHeading(checked, true, "Custom")).toBe("Custom");
  });
});
