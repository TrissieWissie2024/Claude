import type { Claim } from "@/lib/types";

/**
 * Performance claims (brief §2.6). None are verified yet, so none appear on
 * the site. Set `verified: true` only after the claim has been tested and the
 * evidence is on file; lib/claims.ts filters on this flag. A verified claim
 * then appears by itself: `text` in the "Tested" row of the Details accordion
 * on every scent stick page, and `faqAnswer` (or `text`) as the answer of the
 * FAQ question linked to it with `claim` in content/faq.ts.
 */
export const claims: Claim[] = [
  {
    id: "longevity",
    text: "Lasts up to 6 hours on skin.",
    verified: false,
    evidence: "Wear test on a panel of testers, documented per scent. Not done yet.",
    faqAnswer:
      "Up to 6 hours on skin in our wear test. It still depends on your skin, the weather and how much you apply.",
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
    faqAnswer:
      "Yes. It is a 15 g solid, so it stays out of the liquids bag. Security rules still differ per airport and change over time, so check the current rules for your trip.",
  },
];
