import type { NavLink } from "@/lib/types";

import type { ScentSlug } from "./finder";
import { offers } from "./offers";
import { facts, site } from "./site";

/**
 * Homepage copy, section by section in page order (docs/PLAN.md §4).
 *
 * Copy rules (brief §2, docs/PLAN.md §13): specifications only, no performance
 * claims, no social proof, no exclamation marks, no other brands. Days,
 * amounts and times come from content/offers.ts and content/shipping.ts via
 * `facts` in content/site.ts. Templated strings are small functions that take
 * plain strings (dates and amounts arrive already formatted by lib/delivery.ts
 * and lib/money.ts). Checked by content/content-guard.test.ts.
 *
 * Every section has an `id` for its anchor (`<section id>`), a small caps
 * `label` above the heading and a serif `heading` (h2; the hero heading is the
 * page h1).
 */

/** A short spec pill. Labels are drawn from site.specs only. */
export interface SpecPill {
  /** Matches an id in site.specs. */
  id: string;
  label: string;
}

export interface HowItWorksStep {
  id: "twist" | "swipe" | "go";
  title: string;
  text: string;
  /** lucide-react icon name in kebab case (RotateCw, MoveHorizontal, Navigation). */
  icon: "rotate-cw" | "move-horizontal" | "navigation";
}

export interface ComparisonRow {
  id: "format" | "alcohol" | "glass" | "leak-risk";
  label: string;
  solid: string;
  spray: string;
}

/** Sort options for the homepage grid; values match the `?sort=` param of /collections/all. */
export type HomeSortValue = "featured" | "newest" | "price-asc" | "price-desc";

export interface VideoSlotCopy {
  /** Matches the ugc-0n slot in content/assets.ts and /videos/ugc-0n.mp4. Own brand content, not customer videos. */
  id: "ugc-01" | "ugc-02" | "ugc-03" | "ugc-04";
  /** Short title, also used for the play button's accessible name. */
  title: string;
  /** Placeholder label shown until the real video exists. */
  label: string;
}

/** The three sticks in the hero render, left to right (docs/PLAN.md §14). */
const heroScents: ScentSlug[] = ["north-swell", "drift-and-ember", "lantern-smoke"];

const heroPills: SpecPill[] = [
  { id: "twist-up", label: "15 g twist-up" },
  { id: "alcohol-free", label: "Alcohol-free" },
];

// Guard: pills may only repeat specifications that exist in site.specs.
for (const pill of heroPills) {
  if (!site.specs.some((spec) => spec.id === pill.id)) {
    throw new Error(`content/home.ts: hero pill "${pill.id}" is not a spec in content/site.ts.`);
  }
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    id: "twist",
    title: "Twist",
    text: "Turn the base. A few millimetres is enough.",
    icon: "rotate-cw",
  },
  {
    id: "swipe",
    title: "Swipe",
    text: "Two or three swipes over wrists, neck and chest.",
    icon: "move-horizontal",
  },
  {
    id: "go",
    title: "Go",
    text: "Twist it down, cap on, back in your pocket.",
    icon: "navigation",
  },
];

/** Exactly four rows (brief §6.8). No rows on longevity, number of uses or travel rules. */
const comparisonRows: ComparisonRow[] = [
  {
    id: "format",
    label: "Format",
    solid: "A 15 g twist-up stick. You apply it straight to the skin.",
    spray: "A liquid in a bottle with a pump. Wider projection, and quicker to apply over clothing.",
  },
  {
    id: "alcohol",
    label: "Alcohol",
    solid: "Alcohol-free. A plant-based wax base with jojoba and coconut oil carries the scent.",
    spray: "Usually alcohol-based. The alcohol carries the scent and evaporates.",
  },
  {
    id: "glass",
    label: "Glass",
    solid: "None. A matte black aluminium tube.",
    spray: "Usually a glass bottle.",
  },
  {
    // Describes the physical form only. Never a promise about bags or travel (brief §2.6).
    id: "leak-risk",
    label: "Leak risk",
    solid:
      "A solid, so there is no liquid to spill. The wax melts at skin temperature, so it softens in heat. Keep the cap on and keep it out of the sun.",
    spray: "A liquid. A loose cap or a cracked bottle can spill.",
  },
];

const defaultSort: HomeSortValue = "featured";

const sortOptions: { value: HomeSortValue; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** "From CORVANE": our own films. Never framed as customers, reviews or testimonials. */
const videoSlots: VideoSlotCopy[] = [
  // Labels stay short so every placeholder label fits on one or two lines; the 9:16 spec is in docs/PLAN.md §14.
  { id: "ugc-01", title: "Gym bag", label: "VIDEO: Gym bag" },
  { id: "ugc-02", title: "Desk drawer", label: "VIDEO: Desk drawer" },
  { id: "ugc-03", title: "Weekend bag", label: "VIDEO: Weekend bag" },
  { id: "ugc-04", title: "Night out", label: "VIDEO: Night out" },
];

const guaranteeDays = offers.guaranteeDays;
const withdrawalDays = offers.withdrawalDays;

export const home = {
  meta: {
    title: "Solid cologne in a twist-up stick",
    description: site.description,
  },

  /** Section 3. Dark hero with the group render. The rating line only renders with real reviews. */
  hero: {
    eyebrow: "Solid cologne",
    /** The page h1. */
    heading: "Cologne that fits in your pocket.",
    subheading: "Six original scents in a 15 g twist-up stick. No glass. No spray. No fuss.",
    pillsLabel: "Specifications",
    pills: heroPills,
    groupScents: heroScents,
    /** Alt text for the group render. */
    renderAlt: "Three CORVANE sticks: North Swell, Drift & Ember and Lantern Smoke",
    primaryCta: { label: "Shop the range", href: "/collections/all" } satisfies NavLink,
    secondaryCta: { label: "Find your scent", href: "#scent-finder" } satisfies NavLink,
    /** Anchor of the hero section. */
    id: "hero",
  },

  /**
   * Section 4. Fixed text only: never a countdown to the cut-off (brief §2.3).
   * `day` comes from formatDayLabel() ("tomorrow", "Monday", "Mon 2 Nov"),
   * dates from formatDate() ("Tue 27 Oct"), amounts from formatMoneyShort().
   */
  deliveryBar: {
    label: "Delivery",
    /** Shown before mount (no time yet) in the same space. True on every day. */
    fallback: `Order on a working day before ${facts.cutoff} and it ships the same day`,
    shipsToday: `Order before ${facts.cutoff}, ships today`,
    shipsOn: (day: string) => `Ships ${day}`,
    estimate: (date: string) => `Estimated delivery: ${date}`,
    estimateRange: (from: string, to: string) => `Estimated delivery: ${from} to ${to}`,
    deliveryTo: (country: string) => `Delivery to ${country}`,
    freeShipping: (amount: string) => `Free shipping from ${amount}`,
    freeShippingDefault: `Free shipping from ${facts.freeShippingFrom}`,
    countryLabel: "Country",
    changeCountry: "Change country",
    note: "Working days only. Weekends and public holidays excluded.",
    /** Anchor of the delivery bar. */
    id: "delivery",
    /** Short dispatch line before mount (no time yet). True on every day. */
    fallbackDispatch: "Ships on working days",
    /** Transit line before mount, from the country's transitDays in content/shipping.ts. True on every day. */
    fallbackEstimate: (min: number, max: number) =>
      min === max
        ? `Delivery in ${min} working ${min === 1 ? "day" : "days"}`
        : `Delivery in ${min} to ${max} working days`,
    /** Polite announcement after the country switch, e.g. "Estimated delivery: Tuesday to Wednesday (Belgium)." */
    countryChanged: (country: string, estimate: string) => `${estimate} (${country}).`,
  },

  /** Section 5. The six scents and the Discovery Set. */
  productGrid: {
    id: "shop",
    label: "The range",
    heading: "Six scents. Pick yours.",
    intro: "From fresh to dark. Undecided? Start with the Discovery Set.",
    sort: {
      label: "Sort by",
      options: sortOptions,
      defaultValue: defaultSort,
    },
    viewAll: { label: "Shop all", href: "/collections/all" } satisfies NavLink,
    /** Product card extras (the rest of the card copy lives in content/collection.ts, productCard). */
    card: {
      /** Gift cards have several amounts, so the card links to the product page instead of adding. */
      chooseAmount: "Choose amount",
      chooseAmountLabel: (name: string) => `Choose amount for the ${name}`,
      /**
       * Accessible name of quick add while it shows "Added", e.g. "Added: North Swell".
       * Starts with the visible text (WCAG 2.5.3).
       */
      addedLabel: (name: string) => `Added: ${name}`,
    },
  },

  /** Section 6. */
  howItWorks: {
    id: "how-it-works",
    label: "How it works",
    heading: "Twist. Swipe. Go.",
    intro: "From pocket to skin and back.",
    steps: howItWorksSteps,
    /** The scent whose ring colour the step renders show (one stick through all three steps). */
    renderScent: "north-swell" as ScentSlug,
  },

  /** Section 7. A fair comparison with spray in general. No brands, no performance numbers. */
  comparison: {
    id: "solid-vs-spray",
    label: "Compare",
    heading: "Solid vs spray",
    intro:
      "Two ways to wear scent, and both have their place. Here is how the formats differ, in general.",
    /** Table caption for screen readers. */
    caption: "Solid cologne compared with spray in general",
    columns: {
      feature: "Feature",
      solid: "Solid cologne",
      spray: "Spray (in general)",
    },
    rows: comparisonRows,
    note: "A general comparison of formats, not of any product or brand. Sprays differ.",
    /** The intro as shown. The hedge lives in the "Spray (in general)" column and the note. */
    introShort: "Two formats. Both have their place.",
  },

  /** Section 8. The quiz copy itself lives in content/finder.ts. */
  scentFinder: {
    /** Anchor target of the hero's secondary CTA. */
    id: "scent-finder",
    label: "Scent finder",
    heading: "Find your scent",
    intro: "Three questions, one suggestion. No email needed.",
  },

  /** Section 9a. Real reviews only (content/reviews.ts). Empty at launch, so the empty state shows. */
  reviews: {
    id: "reviews",
    label: "Reviews",
    /**
     * Section heading with reviews, unless the verified heading applies. Says
     * nothing about who wrote them (brief §2.2).
     */
    heading: "What reviewers say",
    /**
     * Section heading only when `verification` is set and every review shown
     * has `verifiedPurchase: true` (components/home/ReviewsSection.tsx).
     */
    headingVerified: "From verified buyers",
    /**
     * How CORVANE checks that a review comes from someone who bought the
     * product, shown under the heading whenever reviews show (UCPD art. 7(6)
     * and Annex I point 23b). null until a review app checks purchases: then
     * no review is called verified (no verified heading, no "Verified buyer"
     * label) and `unverifiedNote` is shown instead. Write it as one or two
     * plain sentences that describe the real check.
     */
    verification: null as string | null,
    /** Under the heading while `verification` is null and reviews show. */
    unverifiedNote: "Reviews are not checked against orders.",
    empty: {
      heading: "No reviews yet",
      /** Neutral until a review app checks purchases: no claim about who the reviewers are. */
      body: "CORVANE is new. Reviews appear here as they come in.",
    },
    /** Only used once real reviews exist. */
    count: (count: number) => (count === 1 ? "1 review" : `${count} reviews`),
    /** Label on one review: only with `verification` set and `verifiedPurchase: true`. */
    verifiedBuyer: "Verified buyer",
    /** Accessible name of the stars on one review. Only used once real reviews exist. */
    ratingLabel: (rating: number) => `Rated ${rating} out of 5`,
    /** Where a review was collected (Review.source), e.g. "Collected by judge.me". */
    source: (source: string) => `Collected by ${source}`,
    /** Section heading while there are no reviews. */
    emptyTitle: "No reviews yet.",
  },

  /** Section 9b. Our own 9:16 films (docs/PLAN.md §14). Never "customer" or "review". */
  videoRow: {
    id: "from-corvane",
    label: "Films",
    heading: "From CORVANE",
    intro: "Where the stick goes and how it is used.",
    note: "Brand content, filmed by CORVANE.",
    slots: videoSlots,
    play: (title: string) => `Play video: ${title}`,
    pause: (title: string) => `Pause video: ${title}`,
    /** Accessible name of the row (it scrolls sideways on mobile, so it takes keyboard focus). */
    listLabel: "Films from CORVANE",
  },

  /**
   * Section 10. The guarantee is a voluntary extra. The statutory right of
   * withdrawal is mentioned only as the right it comes on top of, never as a
   * perk (docs/PLAN.md §13).
   */
  guarantee: {
    id: "guarantee",
    label: "Guarantee",
    heading: `${guaranteeDays}-day guarantee`,
    lead: `Not the right scent? Tell us within ${guaranteeDays} days of delivery. Opened or not, send it back.`,
    points: [
      {
        id: "what",
        title: "What it means",
        text: "We refund what you paid for that product, or swap it for another scent.",
      },
      {
        id: "condition",
        title: "The condition",
        text: `Email us your order number within ${guaranteeDays} days of delivery, then send it back. Return postage is yours. One claim per item. E-gift cards excluded.`,
      },
      {
        id: "rights",
        title: "On top of your rights",
        // Names the sealed-stick exception, as everywhere the right of withdrawal is explained (D28).
        text: `This guarantee comes in addition to your ${withdrawalDays}-day statutory right of withdrawal. It does not replace or limit it. Sticks and mini sticks are delivered sealed: once you break the seal, the right of withdrawal no longer applies to that item, but this guarantee does.`,
      },
    ],
    link: { label: "Read the full conditions", href: "/shipping-returns#guarantee" } satisfies NavLink,
    /** Decorative seal beside the heading ("30" over "days"); the heading says the same in words. */
    seal: { value: String(guaranteeDays), unit: "days" },
    /** Plain information link under the "rights" point. The statutory right is never a perk. */
    rightsLink: { label: "Your right of withdrawal", href: "/shipping-returns#withdrawal" } satisfies NavLink,
    /** The section h2; `heading` ("30-day guarantee") is the eyebrow above it. */
    title: "Wrong scent? Send it back.",
    /** The lead under `title`: each fact once (the days are in the eyebrow and here). */
    leadShort: `Tell us within ${guaranteeDays} days of delivery. Opened or not.`,
  },

  /** Section 11. Questions come from content/faq.ts (onHome). */
  faq: {
    id: "faq",
    label: "FAQ",
    heading: "Questions",
    link: { label: "All questions", href: "/faq" } satisfies NavLink,
    /** Small line under the link: where to go when the answer is not here. */
    contact: { text: "Something else?", link: { label: "Contact us", href: "/contact" } satisfies NavLink },
  },

  /** Section 12. Fictional brand story (brief §3). No founding years or numbers we cannot back. */
  story: {
    id: "story",
    label: "Our story",
    heading: "Made where the wind turns.",
    paragraphs: [
      "CORVANE started on the North Sea coast. Wide beaches, cold water and a wind that keeps changing its mind. A weather vane turns with all of it and still points somewhere.",
      "The idea came from there: smell good without carrying a bottle. So we made cologne solid. A 15 g twist-up stick, alcohol-free, small enough for a pocket.",
    ],
    /** PhotoSlot placeholder until a real photo exists. */
    photoLabel: "PHOTO: North Sea coast, dunes and a weather vane",
    link: { label: "Read our story", href: "/about" } satisfies NavLink,
    /** The name as a short dictionary entry (brief §3: cor + vane). */
    name: {
      label: "The name",
      word: site.name,
      pronunciationLabel: "Pronounced",
      pronunciation: site.pronunciation,
      parts: [
        { id: "cor", term: "Cor", meaning: "Latin for heart." },
        { id: "vane", term: "Vane", meaning: "As in weather vane. It turns with the wind but holds its point." },
      ],
    },
    tagline: site.tagline,
  },
};

export type Home = typeof home;
