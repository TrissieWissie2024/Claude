import { describe, expect, it } from "vitest";

import type { StickProduct } from "@/lib/types";

import {
  finder,
  finderQuestions,
  finderScentOrder,
  recommendScent,
  scoreScents,
  type FinderAnswers,
  type ScentSlug,
} from "./finder";
// Test only: app code reads products through lib/commerce (docs/PLAN.md §11).
import { products } from "./products";

const sticks = products.filter((product): product is StickProduct => product.kind === "stick");

/** Every combination of one option per question. */
function allAnswerSets(): FinderAnswers[] {
  let sets: FinderAnswers[] = [{}];
  for (const question of finderQuestions) {
    sets = sets.flatMap((set) => question.options.map((option) => ({ ...set, [question.id]: option.id })));
  }
  return sets;
}

describe("scent finder data", () => {
  it("has three questions with unique ids and options", () => {
    expect(finderQuestions).toHaveLength(3);
    expect(new Set(finderQuestions.map((question) => question.id)).size).toBe(3);
    for (const question of finderQuestions) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      const ids = question.options.map((option) => option.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("only scores scents that exist in the catalog", () => {
    const slugs = new Set(sticks.map((stick) => stick.slug));
    for (const question of finderQuestions) {
      for (const option of question.options) {
        for (const slug of Object.keys(option.scores)) {
          expect(slugs.has(slug)).toBe(true);
        }
      }
    }
  });

  it("breaks ties in featuredRank order, matching the catalog", () => {
    const byRank = [...sticks].sort((a, b) => a.featuredRank - b.featuredRank).map((stick) => stick.slug);
    expect(finderScentOrder).toEqual(byRank);
  });

  it("has a result line for every scent", () => {
    for (const slug of finderScentOrder) {
      expect(finder.result.why[slug].length).toBeGreaterThan(0);
    }
  });
});

describe("recommendScent", () => {
  it("can recommend every scent", () => {
    const reached = new Set<ScentSlug>(allAnswerSets().map((answers) => recommendScent(answers)));
    expect([...reached].sort()).toEqual([...finderScentOrder].sort());
  });

  it("is deterministic", () => {
    for (const answers of allAnswerSets()) {
      const first = recommendScent(answers);
      expect(recommendScent({ ...answers })).toBe(first);
      // Key order of the answers object does not matter.
      const reversed = Object.fromEntries(Object.entries(answers).reverse()) as FinderAnswers;
      expect(recommendScent(reversed)).toBe(first);
    }
  });

  it("returns a top-scoring scent and resolves ties by featuredRank", () => {
    for (const answers of allAnswerSets()) {
      const totals = scoreScents(answers);
      const max = Math.max(...Object.values(totals));
      const winner = recommendScent(answers);
      expect(totals[winner]).toBe(max);
      const firstWithMax = finderScentOrder.find((slug) => totals[slug] === max);
      expect(winner).toBe(firstWithMax);
    }
  });

  it("matches the intended profiles", () => {
    expect(recommendScent({ occasion: "gym", place: "shore", character: "clean" })).toBe("north-swell");
    expect(recommendScent({ occasion: "work", place: "harbour", character: "clean" })).toBe("iron-coast");
    expect(recommendScent({ occasion: "travel", place: "dunes", character: "green" })).toBe("dune-fig");
    expect(recommendScent({ occasion: "travel", place: "harbour", character: "spiced" })).toBe("harbour-tea");
    expect(recommendScent({ occasion: "night", place: "fire", character: "spiced" })).toBe("drift-and-ember");
    expect(recommendScent({ occasion: "night", place: "fire", character: "dark" })).toBe("lantern-smoke");
  });

  it("ignores unknown ids and falls back to the first featured scent", () => {
    expect(recommendScent({})).toBe("north-swell");
    expect(recommendScent({ occasion: "nope" } as FinderAnswers)).toBe("north-swell");
    expect(recommendScent({ occasion: "night", place: "nope" })).toBe("lantern-smoke");
  });
});
