import { formatMoney, formatMoneyShort } from "@/lib/money";
import type { BadgeId, NavLink } from "@/lib/types";

import { offers } from "./offers";
import { shipping } from "./shipping";

/**
 * Brand, navigation, footer and site-wide UI copy.
 *
 * Copy rules (docs/PLAN.md §13, brief §2): no exclamation marks, no emoji, no
 * hype words, no performance claims, no social proof. Amounts, days and times
 * are derived from content/offers.ts and content/shipping.ts so they can never
 * drift apart. Templated strings are small functions that take plain strings
 * or numbers (amounts arrive already formatted with lib/money.ts).
 * content/content-guard.test.ts checks every string in this file.
 */

/* ------------------------------------------------------------------ */
/* Derived shipping and offer facts                                    */
/* ------------------------------------------------------------------ */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function workingDays(min: number, max: number): string {
  if (min === max) return min === 1 ? "1 working day" : `${min} working days`;
  return `${min} to ${max} working days`;
}

const COUNTRIES_WITH_ARTICLE = new Set(["Netherlands"]);

const defaultCountry =
  shipping.countries.find((country) => country.code === shipping.defaultCountry) ??
  shipping.countries[0];

const sameTermsEverywhere = shipping.countries.every(
  (country) => country.freeFrom === defaultCountry.freeFrom && country.rate === defaultCountry.rate,
);

const welcomeDiscount = offers.discountCodes.find((code) => code.code === offers.welcomeCode);
if (!welcomeDiscount) {
  throw new Error("content/site.ts: offers.welcomeCode must exist in offers.discountCodes.");
}

/**
 * Facts shared by site, PDP, cart and FAQ copy. All derived from config.
 * Use these instead of typing "€50" or "15:00" into copy.
 */
export const facts = {
  /** Dispatch cut-off in warehouse time, e.g. "15:00". */
  cutoff: `${pad(shipping.cutoff.hour)}:${pad(shipping.cutoff.minute)}`,
  timeZoneLabel: "Amsterdam time",
  /** Free-shipping threshold of the default country, e.g. "€50". */
  freeShippingFrom: formatMoneyShort(defaultCountry.freeFrom),
  /** Flat shipping rate of the default country, e.g. "€4.95". */
  shippingRate: formatMoney(defaultCountry.rate),
  /** True when every country has the same rate and threshold. */
  sameTermsEverywhere,
  /** e.g. "NL and BE". */
  countryCodes: joinList(shipping.countries.map((country) => country.code)),
  /** e.g. "the Netherlands and Belgium". */
  countryNames: joinList(
    shipping.countries.map((country) =>
      COUNTRIES_WITH_ARTICLE.has(country.name) ? `the ${country.name}` : country.name,
    ),
  ),
  /** Delivery time per country, e.g. "1 working day in the Netherlands". */
  transit: shipping.countries.map((country) => ({
    code: country.code,
    text: `${workingDays(country.transitDays.min, country.transitDays.max)} in ${
      COUNTRIES_WITH_ARTICLE.has(country.name) ? `the ${country.name}` : country.name
    }`,
  })),
  guaranteeDays: offers.guaranteeDays,
  withdrawalDays: offers.withdrawalDays,
  subscriptionPercent: offers.subscription.discountPercent,
  freePouchMinSticks: offers.freePouch.minSticks,
  welcomeCode: welcomeDiscount.code,
  /** e.g. "10% off your first order". */
  welcomeLabel: welcomeDiscount.label,
  welcomePercent: welcomeDiscount.value,
};

/** One sentence that is true on every day of the year: holidays and weekends are excluded. */
const dispatchLine = `Order on a working day before ${facts.cutoff} and it ships the same day`;

const freeShippingLine = facts.sameTermsEverywhere
  ? `Free shipping to ${facts.countryCodes} from ${facts.freeShippingFrom}`
  : `Free shipping from ${facts.freeShippingFrom}`;

/** What a subscriber signs up for (brief §2.8). Shared by the popup and the footer form. */
const signUpText =
  "By signing up you get CORVANE emails about product news, new scents and offers. Unsubscribe any time.";

const rewardConditions = "One code per order. Excludes gift cards.";

/** Rendered as: before + <a href>linkLabel</a> + after. */
const privacyLink = {
  before: "Read how we handle your data in our ",
  linkLabel: "Privacy Policy",
  after: ".",
  href: "/privacy-policy",
};

/* ------------------------------------------------------------------ */
/* Site                                                                */
/* ------------------------------------------------------------------ */

export const site = {
  name: "CORVANE",
  tagline: "Scent with direction.",
  pronunciation: "kor-VAYN",
  nameMeaning:
    "Cor is Latin for heart. A vane is a weather vane: it turns with the wind but holds its point.",
  /** Fictional brand story, one line (brief §3). */
  story:
    "Started on the North Sea coast. Made for men who want to smell good without carrying a bottle of cologne.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://corvane.example",
  description:
    "Solid cologne in a 15 g twist-up stick. Alcohol-free, plant-based wax base, matte black aluminium tube. Six original scents from the North Sea coast.",
  locale: "en",

  /** The only product facts copy may state (brief §2.6). Short label plus a full sentence. */
  specs: [
    { id: "weight", label: "15 g", text: "15 g of solid cologne in every stick." },
    { id: "alcohol-free", label: "Alcohol-free", text: "No alcohol in the formula." },
    { id: "twist-up", label: "Twist-up", text: "Twist up, swipe, twist down. No spray, no glass." },
    {
      id: "wax-base",
      label: "Plant-based wax",
      text: "A plant-based wax base with jojoba and coconut oil. It melts at skin temperature.",
    },
    {
      id: "tube",
      label: "Aluminium tube",
      text: "A matte black aluminium tube with an engraved vane and a coloured ring per scent.",
    },
  ],

  nav: [
    { label: "Shop", href: "/collections/all" },
    { label: "Discovery Set", href: "/products/discovery-set" },
    { label: "Gift Cards", href: "/products/e-gift-card" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
  ] satisfies NavLink[],

  /** Shown under the main links in the mobile menu. */
  helpLinks: [
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Contact", href: "/contact" },
    { label: "Account", href: "/account" },
  ] satisfies NavLink[],

  header: {
    homeLabel: "CORVANE, home",
    mainNavLabel: "Main",
    menuTitle: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    account: "Account",
    /** Accessible name of the cart button, including the item count. */
    cart: (count: number) => (count === 1 ? "Cart, 1 item" : `Cart, ${count} items`),
  },

  skipLink: "Skip to content",

  /** Rotating USP bar: shown when no campaign runs. Every line is always true. */
  usps: [
    { id: "free-shipping", icon: "truck", text: freeShippingLine },
    { id: "guarantee", icon: "shield-check", text: `${facts.guaranteeDays}-day guarantee` },
    { id: "dispatch", icon: "package", text: dispatchLine },
  ],

  promoBar: {
    regionLabel: "Announcements",
    endsIn: "Ends in",
    /** Units for the campaign countdown. Kept short; the countdown is not a live region. */
    units: { days: "d", hours: "h", minutes: "m", seconds: "s" },
    /** Accessible description of when the campaign ends, e.g. "Ends 1 November at 23:59". */
    endsAt: (date: string) => `Ends ${date}`,
    code: (code: string) => `Code ${code}`,
    pause: "Pause messages",
    play: "Play messages",
  },

  badges: {
    new: "New",
    "best-seller": "Best seller",
    "most-popular": "Most popular",
    "best-value": "Best value",
  } satisfies Record<BadgeId | "best-value", string>,

  paymentMethods: [
    { id: "ideal", label: "iDEAL" },
    { id: "bancontact", label: "Bancontact" },
    { id: "visa", label: "Visa" },
    { id: "mastercard", label: "Mastercard" },
    { id: "paypal", label: "PayPal" },
    { id: "apple-pay", label: "Apple Pay" },
  ],
  paymentMethodsLabel: "Payment methods",

  // TODO launch: replace with the real profile URLs once the handles are registered.
  socials: [
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/", placeholder: true },
    { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/", placeholder: true },
  ],
  socialsLabel: "CORVANE on social media",

  // TODO launch: fill in the registered company details (docs/TODO-LAUNCH.md).
  company: {
    legalName: "CORVANE B.V. (placeholder)",
    kvk: "KvK: 00000000 (placeholder)",
    vat: "VAT: NL000000000B01 (placeholder)",
    address: "Street 1, 0000 AA City, the Netherlands (placeholder)",
    email: "hello@corvane.example",
  },

  analytics: {
    enabled: false,
    gtmId: "",
  },

  /** Floating pill and card modal (brief §2.8, docs/PLAN.md §10). */
  emailCapture: {
    enabled: true,
    delayMs: 8000,
    cooldownDays: 7,
    rewardCode: facts.welcomeCode,
    rewardLabel: facts.welcomeLabel,
    rewardConditions,
    /** Honest: picking a card always gives the same reward. No chance, no prize draw. */
    pillLabel: `Pick a card for ${facts.welcomePercent}% off`,
    pillAriaLabel: `Pick a card: every card gives ${facts.welcomeLabel}`,
    title: "Pick a card",
    intro: "Three cards, one reward. Turn one, leave your email and the code is yours.",
    /** Shown before a card is picked. */
    sameRewardNote: `Every card reveals the same reward: ${facts.welcomeLabel}.`,
    cardsLabel: "Cards",
    card: (index: number) => `Turn card ${index}`,
    cardBack: "CORVANE",
    revealedHeading: `${facts.welcomePercent}% off`,
    revealedLine: (reward: string) => `Your reward: ${reward}. Enter your email to get the code.`,
    /** What the subscriber signs up for. There is no checkbox; if one is added, it starts unticked. */
    consent: {
      text: signUpText,
      privacy: privacyLink,
    },
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submit: "Get my code",
    submitting: "Sending",
    successHeading: "Your code",
    successLine: (code: string) =>
      `Use ${code} at checkout for ${facts.welcomeLabel}. ${rewardConditions}`,
    copy: "Copy code",
    copied: "Copied",
    applyToCart: "Apply to cart",
    appliedToCart: "Applied to your cart",
    invalidEmail: "Enter a valid email address.",
    error: "That did not go through. Check your email address and try again.",
    close: "Close",
    dismiss: "No thanks",
  },

  /** Footer newsletter. Same honesty rules as the popup: say what people sign up for. */
  newsletter: {
    heading: "Notes from the coast",
    intro: "Product news, new scents and offers. No noise.",
    consent: {
      text: signUpText,
      privacy: privacyLink,
    },
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submit: "Sign up",
    submitting: "Sending",
    success: "You are on the list.",
    invalidEmail: "Enter a valid email address.",
    error: "That did not go through. Try again in a moment.",
  },

  /** Only rendered when analytics.enabled is true. Accept and reject carry equal weight. */
  consentBanner: {
    title: "Cookies",
    body: "We use functional storage to run the shop, such as your cart. With your permission we also use analytics to see how the site is used. Nothing loads until you choose.",
    accept: "Accept analytics",
    reject: "Reject analytics",
    linkLabel: "Cookie Policy",
    href: "/cookie-policy",
    settings: "Cookie settings",
  },

  footer: {
    columns: [
      {
        heading: "Shop",
        links: [
          { label: "All scents", href: "/collections/all" },
          { label: "Discovery Set", href: "/products/discovery-set" },
          { label: "Travel Pouch", href: "/products/travel-pouch" },
          { label: "Gift Cards", href: "/products/e-gift-card" },
        ] satisfies NavLink[],
      },
      {
        heading: "Help",
        links: [
          { label: "FAQ", href: "/faq" },
          { label: "Shipping & Returns", href: "/shipping-returns" },
          { label: "Contact", href: "/contact" },
          { label: "Account", href: "/account" },
        ] satisfies NavLink[],
      },
      {
        heading: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Find your scent", href: "/#scent-finder" },
        ] satisfies NavLink[],
      },
      {
        heading: "Legal",
        links: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms & Conditions", href: "/terms-and-conditions" },
          { label: "Cookie Policy", href: "/cookie-policy" },
          { label: "Legal notice", href: "/legal-notice" },
        ] satisfies NavLink[],
      },
    ],
    // Update the year when it changes; never compute it during render.
    copyright: "© 2026 CORVANE",
    demoNotice: "Demo store. No orders are shipped and no payment is taken.",
  },

  /**
   * Accessible names of the SVG renders and the print inside them
   * (docs/PLAN.md §13: text that visitors see or hear lives in content/).
   */
  renders: {
    stick: (name: string) => `${name} solid cologne stick`,
    stickOpen: (name: string) => `${name} solid cologne stick with the cap off`,
    /** `names` arrives joined, e.g. "North Swell, Drift & Ember and Lantern Smoke". */
    group: (names: string) => `${names} solid cologne sticks`,
    discoverySet: (names: string) => `Discovery Set: six 3 g mini sticks, ${names}`,
    /** Print on the Discovery Set lid. The render sets the words in capitals; the unit stays lower case ("3 g"). */
    discoverySetLid: { title: "Discovery Set", contents: "Six mini sticks", size: "3 g" },
    pouch: "Travel Pouch: stitched canvas pouch, shown with three sticks (sold separately)",
    giftCard: "CORVANE e-gift card",
    giftCardWithAmount: (amount: string) => `CORVANE e-gift card, ${amount}`,
    /** Print on the card; the render sets it in capitals. */
    giftCardPrint: "E-gift card",
  },

  /** Labels of the UI primitives (components/ui). */
  ui: {
    close: "Close",
    previousPrice: "Previous price",
    currentPrice: "Current price",
    /** Accessible name of a star rating; `average` arrives formatted ("4.6"). */
    rating: (average: string, count: number) =>
      `Rated ${average} out of 5, based on ${count === 1 ? "1 review" : `${count} reviews`}`,
  },

  /** Polite live-region messages announced by the cart provider. */
  cartAnnouncements: {
    added: (name: string) => `Added to cart: ${name}`,
    removed: (name: string) => `Removed from cart: ${name}`,
    quantity: (name: string, quantity: number) => `${name}, quantity ${quantity}`,
    discountApplied: (code: string) => `Code ${code} applied`,
    discountRemoved: "Discount code removed",
    cleared: "Cart cleared",
  },
};

export type Site = typeof site;
