import { home } from "./home";

/**
 * Copy for the collection page (/collections/all) and the product cards used
 * there and in the homepage grid (docs/PLAN.md §11). Prices arrive already
 * formatted with lib/money.ts; whether a card shows a "From" price comes from
 * hasFromPrice() in lib/catalog.ts. Checked by content/content-guard.test.ts.
 */

/** Product cards (ProductCard, QuickAdd). Quick-add adds 1 stick, one-time, and opens the cart. */
export const productCard = {
  /** Card price of a product with several amounts (gift cards), e.g. "From €25". */
  from: (amount: string) => `From ${amount}`,
  quickAdd: "Add",
  quickAddLabel: (name: string) => `Add ${name} to cart`,
  adding: "Adding",
  added: "Added",
  /** Accessible name of the card link. */
  viewProduct: (name: string) => `View ${name}`,
  notesLabel: "Notes",
};

export const collection = {
  meta: {
    title: "Shop",
    description:
      "All six CORVANE solid colognes in 15 g twist-up sticks, plus the Discovery Set, the Travel Pouch and e-gift cards.",
  },
  eyebrow: "Shop",
  h1: "The full range",
  intro: "Six solid colognes, alcohol-free. Plus the Discovery Set, the Travel Pouch and e-gift cards.",
  filter: {
    /** Family filter; only sticks have a family, so a family hides the other products. */
    legend: "Family",
    all: "All",
    /** Accessible name of a family option, e.g. "Show Fresh scents". */
    optionLabel: (family: string) => `Show ${family} scents`,
  },
  /** Same options and values (`?sort=`) as the homepage grid. */
  sort: home.productGrid.sort,
  /** Polite live-region text after filtering or sorting. */
  resultCount: (count: number) => (count === 1 ? "1 product" : `${count} products`),
  empty: {
    heading: "No scents in this family.",
    reset: "Show all",
  },
};

export type Collection = typeof collection;
