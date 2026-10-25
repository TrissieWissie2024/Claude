import type { BundleSize, SubscriptionInterval } from "@/lib/types";

import { facts, site } from "./site";

/**
 * Product page copy (docs/PLAN.md §9). Amounts arrive already formatted with
 * lib/money.ts; percentages, days and times come from content/offers.ts and
 * content/shipping.ts via `facts` in content/site.ts.
 *
 * Copy rules: specifications only, no performance claims, no social proof,
 * no exclamation marks. Checked by content/content-guard.test.ts.
 */

function months(count: number): string {
  return count === 1 ? "month" : `${count} months`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export interface TrustItem {
  id: "secure-payment" | "free-shipping" | "guarantee";
  /** lucide-react icon name. */
  icon: string;
  title: string;
  text: string;
  href?: string;
}

const transitLine = joinList(facts.transit.map((entry) => entry.text));
const paymentLine = joinList(site.paymentMethods.map((method) => method.label));

const trustItems: TrustItem[] = [
  {
    id: "secure-payment",
    icon: "lock",
    title: "Secure payment",
    text: paymentLine,
  },
  {
    id: "free-shipping",
    icon: "truck",
    title: `Free shipping from ${facts.freeShippingFrom}`,
    text: `To ${facts.countryCodes}`,
  },
  {
    id: "guarantee",
    icon: "shield-check",
    title: `${facts.guaranteeDays}-day guarantee`,
    text: "Opened or not. See the conditions.",
    href: "/shipping-returns#guarantee",
  },
];

export const pdp = {
  breadcrumb: {
    label: "Breadcrumb",
    home: "Home",
    shop: "Shop",
  },

  sections: {
    family: "Family",
    notes: "Notes",
    character: "Character",
    scent: "Scent",
    bundle: "How many sticks",
    mixMatch: "Pick your scents",
    purchaseType: "How to buy",
    delivery: "Delivery",
    details: "Product information",
  },

  /** Family line under the title, e.g. "Fresh family". */
  family: (family: string) => `${family} family`,

  notes: {
    label: "Notes",
    top: "Top",
    heart: "Heart",
    base: "Base",
  },

  /** Intensity meters. Indicative, relative within the range, never presented as a measurement. */
  intensity: {
    label: "Indicative",
    explanation:
      "Our own guide to how each scent compares within the range. Not a measurement: skin, weather and how much you apply all change how it comes across.",
    freshWarm: {
      label: "Fresh to warm",
      start: "Fresh",
      end: "Warm",
    },
    projection: {
      label: "Projection",
      start: "Soft",
      end: "Strong",
    },
    /** aria-valuetext for a meter, e.g. "3 of 5". */
    valueText: (value: number, max: number) => `${value} of ${max}`,
  },

  scentPicker: {
    label: "Scent",
    selected: (name: string) => `Scent: ${name}`,
  },

  bundle: {
    legend: "How many sticks",
    tiles: {
      1: "1 stick",
      2: "2 sticks",
      3: "3 sticks",
    } satisfies Record<BundleSize, string>,
    perStick: (price: string) => `${price} per stick`,
    /**
     * Saving versus single sticks bought one-time, e.g. "Save €4.95" (with Subscribe & save the tile
     * saving includes the subscription discount). Text only, never a struck-through price.
     */
    savings: (amount: string) => `Save ${amount}`,
    /** Only on the 3-stick tile (offers.freePouch). */
    freePouch: "Free Travel Pouch (one per order)",
    bestValue: site.badges["best-value"],
  },

  mixMatch: {
    legend: "Pick your scents",
    intro: "Choose a scent for each stick. Mix them as you like.",
    slot: (index: number) => `Stick ${index}`,
    /** Stick 1 is always the scent of the page. */
    firstSlotNote: (name: string) => `${name}, the scent on this page`,
    selectLabel: (index: number) => `Scent for stick ${index}`,
    /** Short marker after the stick 1 name. */
    pageScent: "This page",
    /** Summary of the chosen set, e.g. "Your set: 2 × North Swell and Dune Fig". */
    summary: (names: string) => `Your set: ${names}`,
  },

  purchaseType: {
    legend: "How to buy",
    oneTime: "One-time purchase",
    subscribe: `Subscribe & save ${facts.subscriptionPercent}%`,
    intervalLegend: "Delivery interval",
    intervals: {
      1: "Every month",
      2: "Every 2 months",
      3: "Every 3 months",
    } satisfies Record<SubscriptionInterval, string>,
    deliveredAndBilled: (count: number) => `Delivered and billed every ${months(count)}`,
    perDelivery: (price: string) => `${price} per delivery`,
    subscriptionSavings: (amount: string) => `Save ${amount} on every delivery`,
    /**
     * Honest about the demo: recurring billing is not connected yet.
     * Cancelling before the next delivery must be available when billing goes live (D28, docs/TODO-LAUNCH.md).
     */
    subscriptionNote:
      "Cancel any time before your next delivery. Recurring billing is connected when the shop goes live; until then no payment is taken.",
    /** Short plan names for summaries (sticky bar). */
    oneTimeShort: "One-time",
    /** Compact interval control: legend plus short options, so three fit on one line at 390 px. */
    intervalLegendShort: "Deliver every",
    intervalsShort: {
      1: "1 month",
      2: "2 months",
      3: "3 months",
    } satisfies Record<SubscriptionInterval, string>,
    /** Unit after the subscription price, e.g. "€50.96 per delivery". */
    perDeliveryUnit: "per delivery",
  },

  addToCart: {
    label: "Add to cart",
    withPrice: (price: string) => `Add to cart – ${price}`,
    adding: "Adding",
    added: "Added to cart",
    /** Visual separator between label and total ("Add to cart · €59.95"); rendered aria-hidden. */
    separator: "·",
  },

  /** Mobile bar that appears once the main button scrolls out of view. */
  stickyBar: {
    label: "Quick add to cart",
    summary: (name: string, selection: string) => `${name}, ${selection}`,
    cta: "Add to cart",
    ctaWithPrice: (price: string) => `Add – ${price}`,
    /** Discovery Set and Travel Pouch, e.g. "Quantity: 2". */
    quantity: (count: number) => `Quantity: ${count}`,
    /** E-gift card, e.g. "€50 · Delivered by email". */
    giftCard: (amount: string) => `${amount} · Delivered by email`,
  },

  /** Fixed text only. Never a countdown to the cut-off (brief §2.3). */
  delivery: {
    shipsToday: `Order before ${facts.cutoff}, ships today`,
    /** day: "tomorrow", "Monday", ... */
    shipsOn: (day: string) => `Ships ${day}`,
    estimate: (date: string) => `Estimated delivery: ${date}`,
    estimateRange: (from: string, to: string) => `Estimated delivery: ${from} to ${to}`,
    deliveryTo: (country: string) => `Delivery to ${country}`,
    changeCountry: "Change country",
    countryLabel: "Country",
    note: "Working days only. Weekends and public holidays excluded.",
    giftCard: "Delivered by email. No shipping.",
  },

  /**
   * Trust row under the button. The gift card page leaves out the shipping item.
   * Never list the statutory right of withdrawal here: it is not a selling point (docs/PLAN.md §13).
   */
  trust: {
    label: "Good to know",
    items: trustItems,
  },

  accordions: {
    details: {
      title: "Details",
      items: [
        "15 g solid cologne",
        "Alcohol-free",
        "Twist-up stick",
        "Plant-based wax base with jojoba and coconut oil",
        "Melts at skin temperature",
        "Matte black aluminium tube with an engraved vane",
        "A coloured ring per scent",
      ],
    },
    howToUse: {
      title: "How to use",
      intro: "Twist. Swipe. Go.",
      steps: [
        "Twist the stick up a few millimetres.",
        "Two or three swipes over your wrists, neck and chest.",
        "Twist it back down and put the cap on.",
      ],
      note: "Apply to clean, unbroken skin. Keep it out of direct sun and hot cars: the wax softens in heat.",
    },
    // TODO launch: replace the placeholder with the manufacturer's full INCI list per scent.
    ingredients: {
      title: "Ingredients",
      base: "Plant-based wax base with jojoba and coconut oil. Alcohol-free.",
      inciPlaceholder: "Full INCI list per scent: added here before the shop goes live.",
      isPlaceholder: true,
      note: "Contains fragrance. If your skin is sensitive, try a small area first.",
    },
    shippingReturns: {
      title: "Shipping & returns",
      items: [
        facts.sameTermsEverywhere
          ? `Shipping to ${facts.countryNames}: ${facts.shippingRate}, free from ${facts.freeShippingFrom}.`
          : `Shipping from ${facts.shippingRate}, free from ${facts.freeShippingFrom}.`,
        `Order on a working day before ${facts.cutoff} (${facts.timeZoneLabel}) and it ships the same day.`,
        `Delivery takes ${transitLine}.`,
        // Pre-contract information: the sealed-hygiene exception only holds if customers are told before ordering (D28).
        `You can withdraw from your purchase within ${facts.withdrawalDays} days of delivery. Sticks and mini sticks are delivered sealed: once you break the seal, the right of withdrawal no longer applies to that item.`,
        `Separately, sticks, the Discovery Set and the Travel Pouch come with a ${facts.guaranteeDays}-day guarantee, opened or not.`,
      ],
      link: { label: "Shipping & Returns", href: "/shipping-returns" },
      giftCard: "E-gift cards are delivered by email. There is nothing to ship.",
    },
  },

  crossSell: {
    heading: "Complete the kit",
    slugs: ["discovery-set", "travel-pouch"],
  },

  /** Reviews only from content/reviews.ts. Empty at launch, so the empty state shows. */
  reviews: {
    heading: "Reviews",
    empty: {
      heading: "No reviews yet",
      body: "CORVANE is new. Reviews from verified buyers appear here as they come in.",
    },
  },

  faq: {
    heading: "Questions",
    allLink: { label: "All questions", href: "/faq" },
  },

  gallery: {
    label: "Product images",
    previous: "Previous image",
    next: "Next image",
    thumbnail: (index: number, total: number) => `Show image ${index} of ${total}`,
    slides: {
      packshot: (name: string) => name,
      inHand: (name: string) => `${name} in the hand`,
      notes: (name: string) => `${name}, notes`,
      lifestyle: (name: string) => `${name} in use`,
    },
    /**
     * Placeholder labels for photos that are not supplied yet. PhotoSlot shows
     * them as "PHOTO: <label>"; use `withPrefix` where the prefix is not added.
     * Lifestyle slots use the scene label from content/assets.ts when there is one.
     */
    placeholders: {
      inHand: (name: string) => `${name} in hand, for scale`,
      lifestyle: (name: string) => `${name} in use`,
    },
    photoPrefix: "PHOTO:",
    withPrefix: (label: string) => `PHOTO: ${label}`,
  },

  quantity: {
    label: "Quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
  },

  discoverySet: {
    contentsLabel: "In the set",
    lines: [
      "Six 3 g mini sticks, one of each scent.",
      "Same formula as the full size: alcohol-free, plant-based wax base.",
      "Wear a different one each day. Then pick your stick.",
    ],
    oneTimeOnly: "One-time purchase.",
  },

  travelPouch: {
    lines: [
      "Canvas pouch for your CORVANE sticks. Sticks sold separately.",
      `Free with ${facts.freePouchMinSticks} or more sticks (one per order).`,
    ],
    freeNote: "Free Travel Pouch (one per order)",
    oneTimeOnly: "One-time purchase.",
    /** Shown next to the price on the Travel Pouch page. */
    freeWith: `Free with ${facts.freePouchMinSticks} or more sticks (one per order).`,
  },

  giftCard: {
    amountLegend: "Choose an amount",
    amount: (amount: string) => amount,
    lines: [
      "Digital. Delivered by email.",
      "No shipping, no wrapping.",
      "They choose the scent.",
    ],
    deliveredByEmail: "Delivered by email",
    codesNote: "Discount codes do not apply to gift cards.",
    /** Gift cards are digital: no delivery estimate, no shipping in the trust row. */
    noShipping: "No shipping",
  },

  /* ---------------------------------------------------------------- */
  /* Page shell: title block, gallery, delivery, accordions of the     */
  /* products without a scent, cross-sell (phase 6)                    */
  /* ---------------------------------------------------------------- */

  /** Eyebrow above the name of a product without a scent family (sticks show pdp.family). */
  eyebrow: {
    "discovery-set": "Try all six",
    pouch: "Accessory",
    "gift-card": "Digital gift card",
  },

  /** Size after the price in the title block. The configurator shows the live price. */
  priceSize: {
    stick: "15 g",
    "discovery-set": "6 × 3 g",
  },

  /** The ring colour of each scent in words (Details accordion); the hex lives in the product data. */
  ringColour: {
    label: "Ring colour",
    names: {
      "north-swell": "Light blue",
      "drift-and-ember": "Burnt orange",
      "lantern-smoke": "Deep red",
      "iron-coast": "Steel grey",
      "dune-fig": "Sage green",
      "harbour-tea": "Tea brown",
    } as Partial<Record<string, string>>,
  },

  /** Delivery estimate before mount (no clock yet), in the same space. True on every day. */
  deliveryFallback: {
    dispatch: "Ships on working days",
    estimate: (min: number, max: number) =>
      min === max
        ? `Delivery in ${min} working ${min === 1 ? "day" : "days"}`
        : `Delivery in ${min} to ${max} working days`,
  },

  /** Polite announcement after the country switch, e.g. "Estimated delivery: Tue 27 Oct to Wed 28 Oct (Belgium)." */
  deliveryCountryChanged: (country: string, estimate: string) => `${estimate} (${country}).`,

  /** Screen reader status of the gallery after a swipe or a thumbnail, e.g. "Image 2 of 4". */
  galleryStatus: (index: number, total: number) => `Image ${index} of ${total}`,

  /** Tag next to copy that is a placeholder until launch (INCI list, gift card validity term). */
  toFollow: "To follow",

  /** Accordions of the products without a scent (sticks use pdp.accordions). */
  accordionsFor: {
    discoverySet: {
      details: [
        "Six 3 g mini sticks, one of each scent",
        "Alcohol-free",
        "Plant-based wax base with jojoba and coconut oil",
        "Melts at skin temperature",
        "Same formula as the 15 g stick",
      ],
    },
    pouch: {
      details: [
        "Canvas pouch",
        "Keeps your CORVANE sticks together",
        "Sticks sold separately",
        `Free with ${facts.freePouchMinSticks} or more sticks (one per order)`,
      ],
    },
    giftCard: {
      howItWorks: {
        title: "How it works",
        steps: [
          "Choose an amount.",
          "The e-gift card arrives by email after purchase.",
          "They pick the scent and use the card at checkout.",
        ],
        note: "Redeeming a gift card at checkout becomes available when the shop goes live. Discount codes do not apply to gift cards.",
      },
      validity: {
        title: "Validity",
        // TODO launch: the term follows from the legal check (content/legal.ts, Terms article 14).
        term: "Validity term: confirmed before the shop goes live.",
        isPlaceholder: true,
        items: [
          "Use it for products in this shop, not for other gift cards.",
          "Any balance stays on the card. It cannot be exchanged for cash.",
        ],
      },
      delivery: {
        title: "Delivery",
        text: "Delivered by email after purchase. There is nothing to ship.",
        /** Rendered as: before + <a href>label</a> + after. */
        terms: {
          before: "Withdrawal and validity are set out in the ",
          label: "Terms & Conditions",
          after: ".",
          href: "/terms-and-conditions",
        },
      },
    },
  },

  /** Cross-sell on the pages that are not scent sticks (sticks use pdp.crossSell.heading). */
  crossSellFor: {
    eyebrow: "Also in the range",
    headings: {
      "discovery-set": "Then pick your stick",
      pouch: "Fill the pouch",
      "gift-card": "Or choose for them",
    } as Partial<Record<string, string>>,
  },

  /** Screen reader text of the product page skeleton (unknown slugs, before the 404). */
  loading: "Loading product",
};

export type Pdp = typeof pdp;
