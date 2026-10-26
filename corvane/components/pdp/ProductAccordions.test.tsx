import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { claims } from "@/content/claims";
import { pdp } from "@/content/pdp";
import type { Claim } from "@/lib/types";

import { VerifiedClaimsRow } from "./ProductAccordions";

/*
 * Performance claims (brief §2.6): nothing unverified is shown, and a claim
 * appears on the site once it is set to verified: true. The "Tested" row in
 * the Details accordion of the scent sticks is the place it appears.
 */

describe("VerifiedClaimsRow", () => {
  it("renders nothing at launch (every claim in content/claims.ts is unverified)", () => {
    expect(renderToStaticMarkup(<VerifiedClaimsRow />)).toBe("");
  });

  it("renders only the verified claims once a claim is set to verified: true", () => {
    const source: Claim[] = claims.map((claim) => ({ ...claim, verified: claim.id === "longevity" }));
    const html = renderToStaticMarkup(
      <dl>
        <VerifiedClaimsRow source={source} />
      </dl>,
    );
    expect(html).toContain(pdp.accordions.details.testedLabel);
    expect(html).toContain(claims.find((claim) => claim.id === "longevity")?.text);
    for (const claim of claims.filter((item) => item.id !== "longevity")) {
      expect(html).not.toContain(claim.text);
    }
  });

  it("does not treat a truthy non-boolean as verified", () => {
    const source = claims.map((claim) => ({ ...claim, verified: "true" })) as unknown as Claim[];
    expect(renderToStaticMarkup(<VerifiedClaimsRow source={source} />)).toBe("");
  });
});
