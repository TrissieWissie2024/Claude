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
    /** Bundle saving versus the single-stick price, e.g. "Save €4.95". Text only, never a struck-through price. */
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
  },

  addToCart: {
    label: "Add to cart",
    withPrice: (price: string) => `Add to cart – ${price}`,
    adding: "Adding",
    added: "Added to cart",
  },

  /** Mobile bar that appears once the main button scrolls out of view. */
  stickyBar: {
    label: "Quick add to cart",
    summary: (name: string, selection: string) => `${name}, ${selection}`,
    cta: "Add to cart",
    ctaWithPrice: (price: string) => `Add – ${price}`,
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
};

export type Pdp = typeof pdp;
