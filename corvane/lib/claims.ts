import { claims as allClaims } from "@/content/claims";
import type { Claim, ClaimId, FaqItem } from "@/lib/types";

/**
 * Performance claims are shown only once they are verified (brief §2.6).
 * Components must get claims through these functions, never from content/claims.ts.
 *
 * Where a verified claim appears, with no other change needed:
 * - the "Tested" row in the Details accordion of every scent stick
 *   (VerifiedClaimsRow in components/pdp/ProductAccordions.tsx);
 * - the FAQ answer of a question linked to it (FaqItem.claim), on /faq, the
 *   homepage and product pages (faqAnswer() below).
 * At launch nothing is verified, so both render exactly as before.
 */

/** The claim if it exists and is verified, otherwise null (render nothing). */
export function getVerifiedClaim(id: ClaimId, source: readonly Claim[] = allClaims): Claim | null {
  return source.find((claim) => claim.id === id && claim.verified === true) ?? null;
}

/** All verified claims, in content order. Empty at launch. */
export function getVerifiedClaims(source: readonly Claim[] = allClaims): Claim[] {
  return source.filter((claim) => claim.verified === true);
}

/**
 * The answer to show for a FAQ item: the verified claim's `faqAnswer` (or its
 * `text`) when the item asks about a verified claim, otherwise the item's own
 * answer, which never makes the claim (content/faq.ts).
 */
export function faqAnswer(item: FaqItem, source: readonly Claim[] = allClaims): string {
  if (item.claim === undefined) return item.answer;
  const claim = getVerifiedClaim(item.claim, source);
  return claim ? (claim.faqAnswer ?? claim.text) : item.answer;
}
