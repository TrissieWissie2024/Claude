import type { Claim } from "@/lib/types";

/**
 * Performance claims (brief §2.6). None are verified yet, so none appear on
 * the site. Set `verified: true` only after the claim has been tested and the
 * evidence is on file; lib/claims.ts filters on this flag.
 */
export const claims: Claim[] = [
  {
    id: "longevity",
    text: "Lasts up to 6 hours on skin.",
    verified: false,
    evidence: "Wear test on a panel of testers, documented per scent. Not done yet.",
  },
  {
    id: "applications",
    text: "Around 150 applications per 15 g stick.",
    verified: false,
    evidence: "Usage test: average grams per application, three swipes. Not done yet.",
  },
  {
    id: "carry-on",
    text: "Carry-on friendly. A solid, so it stays out of the liquids bag.",
    verified: false,
    evidence: "Check current airport security rules for solid cosmetics (EU, UK, US). Not done yet.",
  },
];
