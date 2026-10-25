import { formatMoney, formatMoneyShort } from "@/lib/money";
import type { NavLink } from "@/lib/types";

import { cartCopy } from "./cart";
import type { ScentSlug } from "./finder";
import { offers } from "./offers";
import { shipping } from "./shipping";
import { facts, site } from "./site";

/**
 * Copy for the static pages: About, Contact, Account, Checkout (title only),
 * 404 and Shipping & Returns (docs/PLAN.md §1, §5). Legal texts live in
 * content/legal.ts; the checkout stub copy lives in content/cart.ts.
 *
 * Copy rules (brief §2, docs/PLAN.md §13): specifications only, no performance
 * claims, no social proof, no exclamation marks. Days, amounts and times come
 * from content/offers.ts and content/shipping.ts. The 14-day right of
 * withdrawal is a legal right, never a perk; the 30-day guarantee is always
 * presented as something separate. Checked by content/content-guard.test.ts.
 */

export interface PageMeta {
  title: string;
  description: string;
  /** Hint for the page's metadata: keep stubs out of search results. */
  noIndex?: boolean;
}

export interface PageSection {
  /** Anchor id. */
  id: string;
  heading: string;
  /** Paragraphs. */
  body: string[];
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function workingDays(min: number, max: number): string {
  if (min === max) return min === 1 ? "1 working day" : `${min} working days`;
  return `${min} to ${max} working days`;
}

const email = site.company.email;
const withdrawalDays = offers.withdrawalDays;
const guaranteeDays = offers.guaranteeDays;
const transitLine = joinList(facts.transit.map((entry) => entry.text));

/** The six scents in featured order, for the About page. Data comes from the catalog via commerce. */
const aboutScents: ScentSlug[] = [
  "north-swell",
  "drift-and-ember",
  "lantern-smoke",
  "iron-coast",
  "dune-fig",
  "harbour-tea",
];

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

const about = {
  meta: {
    title: "About",
    description:
      "CORVANE started on the North Sea coast. Solid cologne in a 15 g twist-up stick, for men who want to smell good without carrying a bottle.",
  } satisfies PageMeta,
  eyebrow: "About CORVANE",
  h1: site.tagline,
  intro: "A small brand from the North Sea coast. One product, six scents, no bottle.",
  sections: [
    {
      id: "origin",
      heading: "From the North Sea coast",
      body: [
        "CORVANE started on the North Sea coast. Wide beaches, cold water, wind from every side. Weather you wear a coat for.",
        "The scents come from there. Sea salt and bergamot on a clear morning. Driftwood and a fire after dark. Black tea in a harbour café while it rains.",
      ],
    },
    {
      id: "name",
      heading: "The name",
      body: [
        `CORVANE, said ${site.pronunciation}.`,
        site.nameMeaning,
        "That is the idea. Your day changes direction. You keep yours.",
      ],
    },
    {
      id: "idea",
      heading: "Cologne without the bottle",
      body: [
        "We wanted to smell good without carrying a bottle of cologne. Glass breaks, and a bottle belongs on a shelf.",
        "So we made cologne solid. A twist-up stick that fits in your pocket. Twist. Swipe. Go.",
      ],
    },
    {
      id: "made",
      heading: "How it is made",
      body: [
        "A plant-based wax base with jojoba and coconut oil carries the scent. No alcohol.",
        "The wax melts at skin temperature. Twist it up, then two or three swipes over wrists, neck and chest. Heat softens it, so keep it out of the sun.",
        "Every stick holds 15 g, in a matte black aluminium tube with an engraved vane. A coloured ring at the base tells you which scent is which.",
      ],
    },
  ] satisfies PageSection[],
  scents: {
    id: "scents",
    heading: "Six scents",
    body: [
      "Six original scents, each with its own coloured ring. Fresh, woody, dark, green, citrus and aromatic.",
      "Pick the one that fits your day, or try all six first in the Discovery Set.",
    ],
    /** Render these in this order with data from commerce. */
    slugs: aboutScents,
    link: { label: "Shop the range", href: "/collections/all" } satisfies NavLink,
    secondaryLink: { label: "Try the Discovery Set", href: "/products/discovery-set" } satisfies NavLink,
  },
  /** PhotoSlot placeholders until real photos exist. */
  photos: {
    coast: "PHOTO: North Sea coast, wide beach in cold light",
    product: "PHOTO: Stick in hand, cap off",
  },
};

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

const contact = {
  meta: {
    title: "Contact",
    description: "Questions about an order, a scent or a subscription. Send CORVANE a message.",
  } satisfies PageMeta,
  h1: "Contact",
  intro: "Questions about an order, a scent or a subscription. Send a message and we answer on working days.",
  /** Rendered as: before + <a href="mailto:email">email</a> + after. */
  emailLine: { before: "Or email ", email, after: "." },
  /** Shown above the form. The form posts to the /api/contact stub. */
  demoNotice: "Demo form: messages are not sent anywhere.",
  form: {
    label: "Contact form",
    name: { label: "Name", autoComplete: "name" },
    email: { label: "Email address", placeholder: "you@example.com", autoComplete: "email" },
    orderNumber: {
      label: "Order number",
      optional: "(optional)",
      hint: "If your question is about an order.",
    },
    message: { label: "Message" },
    submit: "Send message",
    submitting: "Sending",
    errors: {
      nameRequired: "Enter your name.",
      emailInvalid: "Enter a valid email address.",
      messageRequired: "Write a message.",
    },
    success: {
      heading: "Message received",
      body: `Thanks. This form is a demo, so your message was not sent and nobody will reply. To reach us, email ${email}.`,
    },
    error: `That did not go through. This form is a demo, so nothing was sent. Try again, or email ${email}.`,
  },
};

/* ------------------------------------------------------------------ */
/* Account (stub)                                                      */
/* ------------------------------------------------------------------ */

const account = {
  meta: {
    title: "Account",
    description: "Customer accounts arrive later. Help with an order is one message away.",
    noIndex: true,
  } satisfies PageMeta,
  h1: "Account",
  signIn: {
    heading: "Sign in",
    body: [
      "Customer accounts arrive later. Then you can see your orders and manage your subscriptions here.",
      "For now there is nothing to sign in to, and you do not need an account to order.",
    ],
  },
  orderHelp: {
    heading: "Help with an order",
    body: "Send us your order number and your question. We look it up and get back to you.",
    link: { label: "Contact us", href: "/contact" } satisfies NavLink,
    secondaryLink: { label: "Shipping & Returns", href: "/shipping-returns" } satisfies NavLink,
  },
};

/* ------------------------------------------------------------------ */
/* Checkout (title only; the stub copy lives in content/cart.ts)       */
/* ------------------------------------------------------------------ */

const checkout = {
  meta: {
    title: cartCopy.checkout.title,
    description: "Demo checkout. No payment is taken.",
    noIndex: true,
  } satisfies PageMeta,
};

/* ------------------------------------------------------------------ */
/* 404                                                                 */
/* ------------------------------------------------------------------ */

const notFound = {
  meta: {
    title: "Page not found",
    description: "This page is not here.",
    noIndex: true,
  } satisfies PageMeta,
  eyebrow: "404",
  headline: "Wrong direction.",
  line: "This page is not here. It may have moved, or it never existed.",
  links: [
    { label: "Shop the range", href: "/collections/all" },
    { label: "Read the FAQ", href: "/faq" },
    { label: "Back to home", href: "/" },
  ] satisfies NavLink[],
};

/* ------------------------------------------------------------------ */
/* Shipping & Returns                                                  */
/* ------------------------------------------------------------------ */

/** Rate table rows, derived from content/shipping.ts so they can never drift. */
const rateRows = shipping.countries.map((country) => ({
  code: country.code,
  country: country.name,
  rate: formatMoney(country.rate),
  freeFrom: formatMoneyShort(country.freeFrom),
  deliveryTime: workingDays(country.transitDays.min, country.transitDays.max),
}));

const shippingReturns = {
  meta: {
    title: "Shipping & Returns",
    description: `Shipping to ${facts.countryNames}, delivery times, your ${withdrawalDays}-day right of withdrawal and the separate ${guaranteeDays}-day guarantee.`,
  } satisfies PageMeta,
  /** Contains the statutory withdrawal text: show legalReviewNotice from content/legal.ts at the top. */
  showLegalReviewNotice: true,
  h1: "Shipping & Returns",
  intro: "Where we ship, what it costs, when it arrives and how returns work.",
  tocLabel: "On this page",
  toc: [
    { id: "rates", label: "Shipping rates" },
    { id: "dispatch", label: "Dispatch" },
    { id: "delivery", label: "Delivery times" },
    { id: "withdrawal", label: "Right of withdrawal" },
    { id: "guarantee", label: `${guaranteeDays}-day guarantee` },
    { id: "damaged", label: "Damaged or wrong items" },
  ],

  rates: {
    id: "rates",
    heading: "Shipping rates",
    table: {
      caption: "Shipping rates per country",
      columns: {
        country: "Country",
        rate: "Shipping",
        freeFrom: "Free from",
        deliveryTime: "Delivery time",
      },
      rows: rateRows,
    },
    body: [
      "Prices include VAT. The free-shipping threshold counts the products that ship, before any discount code.",
      "E-gift cards are delivered by email, so they never need shipping.",
    ],
  },

  dispatch: {
    id: "dispatch",
    heading: "Dispatch",
    body: [
      `Order on a working day before ${facts.cutoff} (${facts.timeZoneLabel}) and it ships the same day.`,
      "Later than that, at the weekend or on a Dutch public holiday, it ships the next working day.",
      "Every order ships from the Netherlands.",
    ],
  },

  delivery: {
    id: "delivery",
    heading: "Delivery times",
    body: [
      `After dispatch, delivery takes ${transitLine}.`,
      "Working days exclude weekends and public holidays in the country of delivery.",
      "These are the carrier's usual delivery times, not a promise. The product page shows an estimate for your order.",
    ],
  },

  withdrawal: {
    id: "withdrawal",
    heading: `Right of withdrawal (${withdrawalDays} days)`,
    body: [
      `By law you can withdraw from your purchase within ${withdrawalDays} days, without giving a reason.`,
      `The ${withdrawalDays} days start the day after you, or someone you name (other than the carrier), receive the order. If an order arrives in several parcels, they start after the last parcel. For a subscription, they start after the first delivery.`,
    ],
    howTo: {
      heading: "How to withdraw",
      steps: [
        `Tell us within ${withdrawalDays} days. Email ${email} with your name, your order number and the items you are returning. A clear statement is enough. You can use the model form below, but you do not have to.`,
        `Send the items back within ${withdrawalDays} days of telling us. Return address: ${site.company.legalName}, ${site.company.address}.`,
        "Keep your proof of postage until the refund arrives.",
      ],
    },
    /** Annex I(B) of Directive 2011/83/EU, in English. */
    modelForm: {
      heading: "Model withdrawal form",
      intro: "Complete and return this form only if you wish to withdraw from the contract.",
      lines: [
        `To: ${site.company.legalName}, ${site.company.address}, ${email}`,
        "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*)/for the provision of the following service (*):",
        "Ordered on (*)/received on (*):",
        "Order number:",
        "Name of consumer(s):",
        "Address of consumer(s):",
        "Signature of consumer(s) (only if this form is notified on paper):",
        "Date:",
      ],
      note: "(*) Delete as appropriate.",
    },
    refund: {
      heading: "Refund",
      body: [
        `We refund everything you paid, including the standard shipping cost, within ${withdrawalDays} days of receiving your withdrawal.`,
        "We may wait with the refund until we have the items back, or until you show that you have sent them, whichever comes first.",
        "We refund with the payment method you used, unless you agree to something else. The refund costs you nothing.",
        "Returning part of a set? You get that part's share of the set price you paid. The free Travel Pouch is yours to keep.",
      ],
    },
    returnCosts: {
      heading: "Return costs",
      body: [
        "You pay the direct cost of sending the items back.",
        "Damaged or wrong items are different: then we pay. See below.",
      ],
    },
    condition: {
      heading: "Condition of the items",
      body: [
        "You may handle the items the way you would in a shop, to see what they are. If you handle them more than that and they lose value, we may deduct that loss from your refund.",
        // Legal check (content/legal.ts legalCheckpoints): only valid if sticks are actually delivered sealed.
        "For health and hygiene reasons, sticks and mini sticks are delivered sealed. Once you break the seal after delivery, the right of withdrawal no longer applies to that item. Sealed items can always be returned within the withdrawal period.",
        `Opened a stick and it is not for you? That is what the ${guaranteeDays}-day guarantee below is for.`,
        `E-gift cards: you can withdraw within ${withdrawalDays} days of purchase, as long as the card has not been used.`,
      ],
    },
  },

  /** The voluntary guarantee. Always separate from, and in addition to, the right of withdrawal. */
  guarantee: {
    id: "guarantee",
    heading: `${guaranteeDays}-day guarantee`,
    body: [
      "Separate from the right of withdrawal, and in addition to it. It does not replace or limit that right, or your other statutory rights.",
      `Not the right scent for you? Tell us within ${guaranteeDays} days of delivery, even if you have opened and used it. Send it back and we refund what you paid for that product. Prefer another scent? We can swap it instead.`,
    ],
    conditions: {
      heading: "Conditions",
      items: [
        `Email ${email} within ${guaranteeDays} days of delivery, with your order number and the product.`,
        "Send the product back. Opened is fine.",
        "Applies to sticks, mini sticks, the Discovery Set and the Travel Pouch bought in this shop. Not to e-gift cards.",
        "One claim per item. You pay the cost of return shipping.",
      ],
    },
  },

  /** Statutory conformity: not limited to the withdrawal period or the guarantee. */
  damaged: {
    id: "damaged",
    heading: "Damaged or wrong items",
    body: [
      `Something arrived damaged, faulty or not what you ordered? Email ${email} with your order number and a photo.`,
      "We send a replacement or refund you, including the shipping costs. You pay nothing to send it back.",
      `This is your statutory right to a product that matches what you ordered. It is not limited to ${withdrawalDays} or ${guaranteeDays} days.`,
    ],
  },

  contact: {
    heading: "Questions",
    body: "Something not covered here? Send us a message.",
    link: { label: "Contact us", href: "/contact" } satisfies NavLink,
  },
};

export const pages = {
  about,
  contact,
  account,
  checkout,
  notFound,
  shippingReturns,
};

export type Pages = typeof pages;
