/**
 * Scent finder: three questions, one suggestion (docs/PLAN.md §4, section 8).
 *
 * Scoring: every option adds points to one or more scents. recommendScent()
 * sums the points of the chosen options and returns the scent with the most.
 * Ties are broken by featuredRank (lower wins), mirrored in `finderScentOrder`
 * because only lib/commerce/local.ts may import content/products.ts.
 * content/finder.test.ts checks that the order matches the catalog, that every
 * scent is reachable and that the function is deterministic.
 *
 * Unknown question or option ids are ignored. With no valid answers every
 * score is 0 and the first scent in `finderScentOrder` wins.
 */

export type ScentSlug =
  | "north-swell"
  | "drift-and-ember"
  | "lantern-smoke"
  | "iron-coast"
  | "dune-fig"
  | "harbour-tea";

export type FinderQuestionId = "occasion" | "place" | "character";

export interface FinderOption {
  id: string;
  label: string;
  scores: Partial<Record<ScentSlug, number>>;
}

export interface FinderQuestion {
  id: FinderQuestionId;
  prompt: string;
  options: FinderOption[];
}

/** Tie-break order: the catalog's featuredRank, lowest first. */
export const finderScentOrder: ScentSlug[] = [
  "north-swell",
  "drift-and-ember",
  "lantern-smoke",
  "iron-coast",
  "dune-fig",
  "harbour-tea",
];

export const finderQuestions: FinderQuestion[] = [
  {
    id: "occasion",
    prompt: "Where will you wear it most?",
    options: [
      { id: "gym", label: "Gym and training", scores: { "north-swell": 3, "iron-coast": 2, "dune-fig": 1 } },
      { id: "work", label: "Work and meetings", scores: { "iron-coast": 3, "harbour-tea": 2, "north-swell": 1 } },
      { id: "travel", label: "Travel and weekends away", scores: { "dune-fig": 3, "harbour-tea": 2, "north-swell": 1 } },
      { id: "night", label: "Nights out", scores: { "lantern-smoke": 3, "drift-and-ember": 2 } },
    ],
  },
  {
    id: "place",
    prompt: "Pick a place.",
    options: [
      { id: "shore", label: "A cold shore at dawn", scores: { "north-swell": 2, "iron-coast": 1 } },
      { id: "dunes", label: "Dunes in late summer", scores: { "dune-fig": 2 } },
      { id: "harbour", label: "A harbour café in the rain", scores: { "harbour-tea": 2, "iron-coast": 1 } },
      { id: "fire", label: "A beach fire after dark", scores: { "drift-and-ember": 2, "lantern-smoke": 1 } },
    ],
  },
  {
    id: "character",
    prompt: "How should it come across?",
    options: [
      { id: "clean", label: "Clean and bright", scores: { "iron-coast": 2, "north-swell": 2 } },
      { id: "green", label: "Green and easy", scores: { "dune-fig": 2 } },
      { id: "spiced", label: "Warm and spiced", scores: { "harbour-tea": 2, "drift-and-ember": 2 } },
      { id: "dark", label: "Dark and smooth", scores: { "lantern-smoke": 2, "drift-and-ember": 1 } },
    ],
  },
];

export type FinderAnswers = Partial<Record<FinderQuestionId, string>>;

/** Points per scent for a set of answers. Pure. */
export function scoreScents(
  answers: FinderAnswers,
  questions: FinderQuestion[] = finderQuestions,
): Record<ScentSlug, number> {
  const totals = Object.fromEntries(finderScentOrder.map((slug) => [slug, 0])) as Record<ScentSlug, number>;
  for (const question of questions) {
    const optionId = answers[question.id];
    const option = question.options.find((candidate) => candidate.id === optionId);
    if (!option) continue;
    for (const slug of finderScentOrder) {
      totals[slug] += option.scores[slug] ?? 0;
    }
  }
  return totals;
}

/**
 * The recommended scent slug for a set of answers. Pure and deterministic:
 * highest score wins, ties go to the scent that comes first in `order`
 * (featuredRank).
 */
export function recommendScent(
  answers: FinderAnswers,
  questions: FinderQuestion[] = finderQuestions,
  order: ScentSlug[] = finderScentOrder,
): ScentSlug {
  const totals = scoreScents(answers, questions);
  let best = order[0];
  for (const slug of order) {
    if (totals[slug] > totals[best]) best = slug;
  }
  return best;
}

export const finder = {
  questions: finderQuestions,
  labels: {
    progress: (current: number, total: number) => `Question ${current} of ${total}`,
    next: "Next",
    back: "Back",
    showResult: "Show my scent",
    pickOne: "Pick one to continue.",
  },
  result: {
    eyebrow: "Your direction",
    heading: (name: string) => `Your scent: ${name}`,
    /** One line per scent: why it fits the answers. Notes only, no claims. */
    why: {
      "north-swell": "Clean and cool for early starts. Sea salt and bergamot, steadied by sage and white cedar.",
      "drift-and-ember": "Warm with a trace of smoke, made for evenings. Pink pepper over driftwood, smoked vetiver and amber below.",
      "lantern-smoke": "Dark and deliberate. Black pepper, worn-in leather and tonka.",
      "iron-coast": "Sharp and composed for the working week. Grapefruit, a mineral accord and vetiver.",
      "dune-fig": "Green and relaxed, for days without a plan. Green fig, dune grass and soft musk.",
      "harbour-tea": "Calm with a little spice. Cardamom, black tea and cedarwood.",
    } satisfies Record<ScentSlug, string>,
    addToCart: "Add to cart",
    addToCartWithPrice: (price: string) => `Add to cart – ${price}`,
    viewProduct: (name: string) => `View ${name}`,
    retake: "Start again",
    discovery: "Not sure yet? The Discovery Set has all six.",
    discoveryLink: { label: "See the Discovery Set", href: "/products/discovery-set" },
  },
};
