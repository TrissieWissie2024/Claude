import { describe, expect, it } from "vitest";
import { claims } from "@/content/claims";
import { faq } from "@/content/faq";
import { offers } from "@/content/offers";
import { reviews } from "@/content/reviews";
import { faqAnswer, getVerifiedClaim, getVerifiedClaims } from "@/lib/claims";
import { getRatingSummary, getReviews, hasReviews } from "@/lib/reviews";
import type { Claim, Review } from "@/lib/types";

/*
 * Launch guards for brief §2: no unverified performance claims, no invented
 * social proof, real reward codes. These fail the build on purpose if content
 * changes without the evidence the brief asks for.
 */

describe("launch state", () => {
  it("has every performance claim unverified, so none is shown", () => {
    expect(claims.length).toBeGreaterThan(0);
    expect(claims.every((claim) => claim.verified === false)).toBe(true);
    expect(getVerifiedClaims()).toEqual([]);
    for (const claim of claims) expect(getVerifiedClaim(claim.id)).toBeNull();
  });

  it("has no reviews and no rating", () => {
    expect(reviews).toEqual([]);
    expect(getReviews()).toEqual([]);
    expect(getReviews("north-swell")).toEqual([]);
    expect(getRatingSummary()).toBeNull();
    expect(getRatingSummary("north-swell")).toBeNull();
    expect(hasReviews()).toBe(false);
  });

  it("has a real welcome code: it exists, is active and is a percent code", () => {
    const welcome = offers.discountCodes.find((code) => code.code === offers.welcomeCode);
    expect(welcome).toBeDefined();
    expect(welcome?.kind).toBe("percent");
    expect(welcome?.active).toBe(true);
    expect(welcome?.source).toBe("welcome");
    expect(welcome?.value).toBeGreaterThan(0);
    expect(welcome?.value).toBeLessThan(100);
  });

  it("ties the campaign to a code that exists in discountCodes", () => {
    if (offers.campaign.code === undefined) return;
    expect(offers.discountCodes.map((code) => code.code)).toContain(offers.campaign.code);
  });
});

describe("claims and reviews helpers", () => {
  const sample: Claim[] = [
    { id: "longevity", text: "Lasts a while.", verified: true, evidence: "Test report." },
    { id: "applications", text: "Many uses.", verified: false, evidence: "Not done." },
  ];

  it("passes on verified claims only", () => {
    expect(getVerifiedClaims(sample).map((claim) => claim.id)).toEqual(["longevity"]);
    expect(getVerifiedClaim("longevity", sample)?.text).toBe("Lasts a while.");
    expect(getVerifiedClaim("applications", sample)).toBeNull();
    expect(getVerifiedClaim("carry-on", sample)).toBeNull();
  });

  const review = (id: string, productSlug: string | null, rating: Review["rating"], date: string): Review => ({
    id,
    productSlug,
    author: "Test",
    rating,
    title: "Title",
    body: "Body",
    date,
    verifiedPurchase: true,
    source: "test",
  });

  const sampleReviews: Review[] = [
    review("a", "north-swell", 5, "2027-01-02"),
    review("b", "north-swell", 4, "2027-01-05"),
    review("c", "north-swell", 4, "2027-01-03"),
    review("d", "dune-fig", 3, "2027-01-04"),
    review("e", null, 5, "2027-01-01"),
  ];

  it("filters reviews per product, newest first", () => {
    expect(getReviews("north-swell", sampleReviews).map((item) => item.id)).toEqual(["b", "c", "a"]);
    expect(getReviews(undefined, sampleReviews)).toHaveLength(5);
    expect(getReviews("iron-coast", sampleReviews)).toEqual([]);
    expect(hasReviews("dune-fig", sampleReviews)).toBe(true);
    expect(hasReviews("iron-coast", sampleReviews)).toBe(false);
  });

  it("summarises ratings rounded to one decimal", () => {
    // (5 + 4 + 4) / 3 = 4.333...
    expect(getRatingSummary("north-swell", sampleReviews)).toEqual({ average: 4.3, count: 3 });
    // (5 + 4 + 4 + 3 + 5) / 5 = 4.2
    expect(getRatingSummary(undefined, sampleReviews)).toEqual({ average: 4.2, count: 5 });
    expect(getRatingSummary("iron-coast", sampleReviews)).toBeNull();
  });

  it("keeps the source order for reviews on the same date and never mutates the source", () => {
    const sameDay = [
      review("first", "north-swell", 5, "2027-02-01"),
      review("second", "north-swell", 3, "2027-02-01"),
      review("older", "north-swell", 4, "2027-01-15"),
    ];
    const before = sameDay.map((item) => item.id);
    expect(getReviews("north-swell", sameDay).map((item) => item.id)).toEqual(["first", "second", "older"]);
    expect(getReviews(undefined, [...sameDay].reverse()).map((item) => item.id)).toEqual(["second", "first", "older"]);
    expect(sameDay.map((item) => item.id)).toEqual(before);
  });

  it("rounds a rating average to one decimal, half up", () => {
    // (5 + 4 + 4 + 4) / 4 = 4.25 -> 4.3
    const four = ["a", "b", "c", "d"].map((id, index) => review(id, "dune-fig", index === 0 ? 5 : 4, "2027-01-01"));
    expect(getRatingSummary("dune-fig", four)).toEqual({ average: 4.3, count: 4 });
  });

  it("only treats verified: true as verified", () => {
    const loose = [{ id: "longevity", text: "x", verified: "true", evidence: "" }] as unknown as Claim[];
    expect(getVerifiedClaims(loose)).toEqual([]);
    expect(getVerifiedClaim("longevity", loose)).toBeNull();
  });
});

describe("FAQ answers and verified claims (brief §2.6)", () => {
  const linked = faq.filter((item) => item.claim !== undefined);

  it("links the longevity and travel questions to their claims", () => {
    expect(faq.find((item) => item.id === "how-long-does-it-last")?.claim).toBe("longevity");
    expect(faq.find((item) => item.id === "travel")?.claim).toBe("carry-on");
    for (const item of linked) expect(claims.map((claim) => claim.id)).toContain(item.claim);
  });

  it("shows each question's own answer at launch, never the claim", () => {
    for (const item of faq) expect(faqAnswer(item)).toBe(item.answer);
    for (const item of linked) {
      const claim = claims.find((entry) => entry.id === item.claim);
      expect(faqAnswer(item)).not.toBe(claim?.faqAnswer);
      expect(faqAnswer(item)).not.toBe(claim?.text);
    }
  });

  it("shows the claim's FAQ answer once that claim is verified, and its text when it has none", () => {
    const longevity = linked.find((item) => item.claim === "longevity");
    const travel = linked.find((item) => item.claim === "carry-on");
    expect(longevity && travel).toBeTruthy();
    const verified: Claim[] = claims.map((claim) => ({ ...claim, verified: true }));
    const expected = verified.find((claim) => claim.id === "longevity");
    expect(faqAnswer(longevity!, verified)).toBe(expected?.faqAnswer ?? expected?.text);
    const withoutAnswer: Claim[] = verified.map((claim) => ({ ...claim, faqAnswer: undefined }));
    expect(faqAnswer(travel!, withoutAnswer)).toBe(claims.find((claim) => claim.id === "carry-on")?.text);
    // Another claim being verified changes nothing for this question.
    const otherOnly: Claim[] = claims.map((claim) => ({ ...claim, verified: claim.id === "applications" }));
    expect(faqAnswer(longevity!, otherOnly)).toBe(longevity!.answer);
  });
});
