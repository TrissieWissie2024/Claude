import type { Product } from "@/lib/types";

/**
 * The catalog: six scents, the Discovery Set, the Travel Pouch and the e-gift card.
 *
 * - Only lib/commerce/local.ts imports this file (docs/PLAN.md §11).
 * - No prices here: every price lives in content/offers.ts (brief §4).
 * - Badges: only "new" at launch (brief §2.7). Never set previousPrice unless it
 *   was genuinely the lowest price in the 30 days before (brief §2.4).
 * - Notes are copied from the brief, lowercase; components capitalise if needed.
 * - Intensity is indicative only: freshWarm 1 = fresh ... 5 = warm,
 *   projection 1 = soft ... 5 = strong. Relative within the range, not measured.
 * - Everything launches on the same day, so the "newest" sort falls back to
 *   featuredRank (lib/catalog.ts sorts ties by featuredRank).
 * - Copy states specifications only. No performance claims (content/claims.ts).
 */

const LAUNCH_DATE = "2026-10-25";

export const products: Product[] = [
  {
    slug: "north-swell",
    name: "North Swell",
    kind: "stick",
    family: "Fresh",
    notes: { top: ["sea salt", "bergamot"], heart: ["sage"], base: ["white cedar"] },
    ringColor: "#6FA8C7",
    intensity: { freshWarm: 1, projection: 3 },
    tagline: "Sea salt and bergamot. A clean start.",
    description:
      "Sea salt and bergamot up front, like the first cold air off the water. Sage keeps it level. White cedar settles it on the skin.",
    mood: "Gym sessions, early starts, the first train out.",
    badges: ["new"],
    featuredRank: 1,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "North Swell Solid Cologne",
      description:
        "North Swell: a fresh solid cologne with sea salt, bergamot, sage and white cedar. 15 g twist-up stick, alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "drift-and-ember",
    name: "Drift & Ember",
    kind: "stick",
    family: "Woody",
    notes: { top: ["pink pepper"], heart: ["driftwood"], base: ["smoked vetiver", "amber"] },
    ringColor: "#C26A3D",
    intensity: { freshWarm: 4, projection: 4 },
    tagline: "Driftwood and the last of the fire.",
    description:
      "Pink pepper opens it with a spark. Driftwood sits at the heart, dry and pale. Smoked vetiver and amber stay warm underneath, like embers after dark.",
    mood: "Dinners, cold weekends, evenings out.",
    badges: ["new"],
    featuredRank: 2,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Drift & Ember Solid Cologne",
      description:
        "Drift & Ember: a woody solid cologne with pink pepper, driftwood, smoked vetiver and amber. 15 g twist-up stick, alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "lantern-smoke",
    name: "Lantern Smoke",
    kind: "stick",
    family: "Dark",
    notes: { top: ["black pepper"], heart: ["leather"], base: ["tonka"] },
    ringColor: "#8B2E2E",
    intensity: { freshWarm: 5, projection: 4 },
    tagline: "Black pepper, leather, late light.",
    description:
      "Black pepper first, sharp and dry. Then leather, worn in. Tonka closes it soft and dark, like a lantern still burning at the end of the pier.",
    mood: "Nights out and the last round.",
    badges: ["new"],
    featuredRank: 3,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Lantern Smoke Solid Cologne",
      description:
        "Lantern Smoke: a dark solid cologne with black pepper, leather and tonka. 15 g twist-up stick, alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "iron-coast",
    name: "Iron Coast",
    kind: "stick",
    family: "Citrus",
    notes: { top: ["grapefruit"], heart: ["mineral accord"], base: ["vetiver"] },
    ringColor: "#8C9399",
    intensity: { freshWarm: 2, projection: 3 },
    tagline: "Grapefruit on cold stone.",
    description:
      "Grapefruit, bright and a little bitter. A mineral accord like wet rock after rain. Vetiver underneath keeps it dry and grounded.",
    mood: "Work days, meetings, the commute.",
    badges: ["new"],
    featuredRank: 4,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Iron Coast Solid Cologne",
      description:
        "Iron Coast: a citrus solid cologne with grapefruit, a mineral accord and vetiver. 15 g twist-up stick, alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "dune-fig",
    name: "Dune Fig",
    kind: "stick",
    family: "Green",
    notes: { top: ["green fig"], heart: ["dune grass"], base: ["soft musk"] },
    ringColor: "#7E9A5B",
    intensity: { freshWarm: 2, projection: 2 },
    tagline: "Green fig in the dunes.",
    description:
      "Green fig, crisp rather than sweet. Dune grass gives it air and a bit of bite. Soft musk keeps it close to the skin.",
    mood: "Weekends away, long walks, days off.",
    badges: ["new"],
    featuredRank: 5,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Dune Fig Solid Cologne",
      description:
        "Dune Fig: a green solid cologne with green fig, dune grass and soft musk. 15 g twist-up stick, alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "harbour-tea",
    name: "Harbour Tea",
    kind: "stick",
    family: "Aromatic",
    notes: { top: ["cardamom"], heart: ["black tea"], base: ["cedarwood"] },
    ringColor: "#A9844F",
    intensity: { freshWarm: 3, projection: 2 },
    tagline: "Cardamom and black tea by the water.",
    description:
      "Cardamom opens it, warm and green at once. Black tea at the heart, dry and calm. Cedarwood rounds it off.",
    mood: "Travel days, slow mornings, the desk.",
    badges: ["new"],
    featuredRank: 6,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Harbour Tea Solid Cologne",
      description:
        "Harbour Tea: an aromatic solid cologne with cardamom, black tea and cedarwood. 15 g twist-up stick, alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "discovery-set",
    name: "Discovery Set",
    kind: "discovery-set",
    contents: "Six 3 g mini sticks, one of each scent",
    tagline: "All six scents, 3 g each.",
    description:
      "Six 3 g mini sticks, one of each scent. Wear a different one each day and see which fits. Then pick your full-size stick.",
    badges: ["new"],
    featuredRank: 7,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Discovery Set: All Six Solid Colognes",
      description:
        "Try all six CORVANE scents: six 3 g mini solid cologne sticks, one of each. Alcohol-free, plant-based wax base.",
    },
  },
  {
    slug: "travel-pouch",
    name: "Travel Pouch",
    kind: "pouch",
    tagline: "Canvas. Keeps your sticks together.",
    description:
      "A canvas pouch for your CORVANE sticks. It keeps them together in a gym bag, a backpack or a washbag. Plain canvas, nothing more than it needs. Sticks sold separately.",
    badges: [],
    featuredRank: 8,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "Travel Pouch",
      description:
        "A canvas travel pouch for CORVANE solid cologne sticks. Keeps your sticks together in a gym bag, a backpack or a washbag.",
    },
  },
  {
    slug: "e-gift-card",
    name: "E-gift card",
    kind: "gift-card",
    tagline: "They pick the scent.",
    description:
      "A digital gift card, delivered by email. They choose the scent, you skip the guessing. No shipping, no wrapping.",
    badges: [],
    featuredRank: 9,
    releasedAt: LAUNCH_DATE,
    seo: {
      title: "E-gift card",
      description:
        "A CORVANE e-gift card, delivered by email. Choose an amount and let them pick their solid cologne.",
    },
  },
];
