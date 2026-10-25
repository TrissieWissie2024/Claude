import { reviews as allReviews } from "@/content/reviews";
import type { RatingSummary, Review } from "@/lib/types";

/**
 * Real reviews only (brief §2.2). content/reviews.ts is empty at launch, so
 * every rating and review component must render nothing or an empty state
 * when these return [] / null / false.
 */

/**
 * Reviews for one product (by slug), or all reviews (product and store) when
 * no slug is given. Newest first.
 */
export function getReviews(productSlug?: string, source: readonly Review[] = allReviews): Review[] {
  const selected = productSlug === undefined ? [...source] : source.filter((review) => review.productSlug === productSlug);
  return selected.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Average rating (rounded to one decimal) and count, or null when there are no reviews. */
export function getRatingSummary(productSlug?: string, source: readonly Review[] = allReviews): RatingSummary | null {
  const selected = getReviews(productSlug, source);
  if (selected.length === 0) return null;
  const sum = selected.reduce((total, review) => total + review.rating, 0);
  return {
    average: Math.round((sum * 10) / selected.length) / 10,
    count: selected.length,
  };
}

/** True when there is at least one real review (for the product, if given). */
export function hasReviews(productSlug?: string, source: readonly Review[] = allReviews): boolean {
  return getReviews(productSlug, source).length > 0;
}
