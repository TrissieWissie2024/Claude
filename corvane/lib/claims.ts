import { claims as allClaims } from "@/content/claims";
import type { Claim, ClaimId } from "@/lib/types";

/**
 * Performance claims are shown only once they are verified (brief §2.6).
 * Components must get claims through these functions, never from content/claims.ts.
 */

/** The claim if it exists and is verified, otherwise null (render nothing). */
export function getVerifiedClaim(id: ClaimId, source: readonly Claim[] = allClaims): Claim | null {
  return source.find((claim) => claim.id === id && claim.verified === true) ?? null;
}

/** All verified claims, in content order. Empty at launch. */
export function getVerifiedClaims(source: readonly Claim[] = allClaims): Claim[] {
  return source.filter((claim) => claim.verified === true);
}
