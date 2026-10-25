import { describe, expect, it } from "vitest";

import {
  finderReducer,
  getAnswer,
  getCurrentQuestion,
  getFinderResult,
  initialFinderState,
  isResultStep,
  type FinderState,
} from "@/components/finder/finderState";
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

/*
 * The quiz UI (components/finder/FinderQuiz.tsx) is driven by this reducer.
 * Tested here because vitest only collects lib/ and content/ tests.
 */
describe("finder quiz state", () => {
  type Step = (state: FinderState) => FinderState;
  const run = (...steps: Step[]) => steps.reduce<FinderState>((state, step) => step(state), initialFinderState);
  const choose = (optionId: string): Step => (state) => finderReducer(state, { type: "select", optionId });
  const next: Step = (state) => finderReducer(state, { type: "next" });
  const back: Step = (state) => finderReducer(state, { type: "back" });
  const restart: Step = (state) => finderReducer(state, { type: "restart" });

  it("walks every path through the three questions to a valid scent", () => {
    const reached = new Set<ScentSlug>();
    for (const answers of allAnswerSets()) {
      const steps = finderQuestions.flatMap((question) => [choose(answers[question.id] as string), next]);
      const state = run(...steps);
      expect(isResultStep(state)).toBe(true);
      const result = getFinderResult(state);
      expect(result).toBe(recommendScent(answers));
      expect(finderScentOrder).toContain(result);
      reached.add(result as ScentSlug);
    }
    expect([...reached].sort()).toEqual([...finderScentOrder].sort());
  });

  it("starts on the first question with nothing chosen", () => {
    expect(getCurrentQuestion(initialFinderState)?.id).toBe(finderQuestions[0].id);
    expect(getAnswer(initialFinderState, finderQuestions[0])).toBeNull();
    expect(getFinderResult(initialFinderState)).toBeNull();
  });

  it("does not move on without an answer and flags it", () => {
    const state = run(next);
    expect(state.step).toBe(0);
    expect(state.missing).toBe(true);
    expect(state.moves).toBe(0);
    const chosen = run(next, choose("gym"));
    expect(chosen.missing).toBe(false);
    expect(run(next, choose("gym"), next).step).toBe(1);
  });

  it("ignores options of other questions and unknown ids", () => {
    expect(run(choose("shore")).answers).toEqual({});
    expect(run(choose("nope")).answers).toEqual({});
    expect(run(choose("shore"), next).step).toBe(0);
  });

  it("keeps answers when going back and forward", () => {
    const state = run(choose("night"), next, choose("fire"), back);
    expect(state.step).toBe(0);
    expect(getAnswer(state, finderQuestions[0])).toBe("night");
    const forward = next(state);
    expect(forward.step).toBe(1);
    expect(getAnswer(forward, finderQuestions[1])).toBe("fire");
  });

  it("changing an earlier answer changes the result", () => {
    const first = run(choose("night"), next, choose("fire"), next, choose("dark"), next);
    expect(getFinderResult(first)).toBe("lantern-smoke");
    const changed = run(choose("night"), next, choose("fire"), next, choose("dark"), next, back, choose("spiced"), next);
    expect(getFinderResult(changed)).toBe("drift-and-ember");
  });

  it("goes back from the result to the last question, and not before the first", () => {
    const result = run(choose("gym"), next, choose("shore"), next, choose("clean"), next);
    expect(back(result).step).toBe(finderQuestions.length - 1);
    expect(back(initialFinderState)).toBe(initialFinderState);
    expect(next(result)).toBe(result);
  });

  it("restart clears the answers and counts as a move", () => {
    const result = run(choose("gym"), next, choose("shore"), next, choose("clean"), next);
    const fresh = restart(result);
    expect(fresh.step).toBe(0);
    expect(fresh.answers).toEqual({});
    expect(fresh.moves).toBe(result.moves + 1);
  });

  it("counts every step change once", () => {
    const state = run(choose("gym"), next, next, choose("shore"), next, back, back);
    expect(state.moves).toBe(4);
  });
});
