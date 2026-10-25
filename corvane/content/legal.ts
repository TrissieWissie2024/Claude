import { formatMoney, formatMoneyShort } from "@/lib/money";
import { storageKeys } from "@/lib/storage";

import { offers } from "./offers";
import { facts, site } from "./site";

/**
 * Legal texts: Privacy Policy, Terms & Conditions, Cookie Policy and Legal
 * notice (docs/PLAN.md §1, brief §6). English drafts for a Dutch B.V. selling
 * to consumers in the Netherlands and Belgium (D27).
 *
 * DRAFTS. Every legal page shows `legalReviewNotice` at the top until a lawyer
 * has checked the texts (docs/TODO-LAUNCH.md). Company details come from
 * site.company and are marked "(placeholder)", like every other value that is
 * not decided yet (retention periods, providers, notice periods, gift card
 * term). Clauses that need a specific check carry a `check` block, shown on
 * the page as a quiet "Legal check" note, and are listed in `legalCheckpoints`
 * with the points that only the lawyer needs to see.
 *
 * Prices, days and times come from content/offers.ts and content/shipping.ts
 * (via `facts`), storage keys from lib/storage.ts, so nothing can drift.
 *
 * Inline markup in any string, rendered by components/legal/LegalPage.tsx:
 * - [label](href) is a link: "/..." internal, "#..." in-page, "mailto:" and
 *   "https:" external (same tab).
 * - `text` is code, used for storage key names.
 * - In the text of a `facts` row, "\n" starts a new line.
 *
 * Checked by content/content-guard.test.ts. Mind its rules when editing: no
 * exclamation marks, and words such as "hours", "lasts" or "alternative to"
 * are banned everywhere in content/.
 */

export type LegalPageId = "privacy" | "terms" | "cookies" | "legalNotice";

/** One row of a definition list: "Legal basis" -> "Your consent". */
export interface LegalFact {
  label: string;
  /** "\n" starts a new line. */
  text: string;
}

/**
 * A block in a section. A plain string is a paragraph; the objects are:
 * - subheading: an h3 inside the section;
 * - list: bullets, or numbers with `ordered`;
 * - facts: a definition list (label and text per row);
 * - check: a drafting note for the lawyer, shown as a small "Legal check" note.
 */
export type LegalBlock =
  | string
  | { kind: "subheading"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "facts"; items: LegalFact[] }
  | { kind: "check"; text: string };

export interface LegalSection {
  /** Anchor id. Keep it stable: other pages may link to it (e.g. /terms-and-conditions#withdrawal). */
  id: string;
  heading: string;
  /** Paragraphs and blocks, in order. */
  body: LegalBlock[];
}

export interface LegalPage {
  title: string;
  /** Meta description. */
  description: string;
  /** Shown at the top of the page until a lawyer has checked the text (brief §6). Always legalReviewNotice. */
  reviewNotice: string;
  intro: string;
  /** ISO date (YYYY-MM-DD) of the last change. A fixed string, never computed. */
  updated: string;
  /** Number the sections as articles ("11. Right of withdrawal"), so the text can refer to them. */
  numbered?: boolean;
  sections: LegalSection[];
}

/** Exact text required by the brief (§6). Shown at the top of every legal page. */
export const legalReviewNotice = "TODO: laten controleren";

/** Routes of the legal pages (docs/PLAN.md §1). */
export const legalRoutes: Record<LegalPageId, string> = {
  privacy: "/privacy-policy",
  terms: "/terms-and-conditions",
  cookies: "/cookie-policy",
  legalNotice: "/legal-notice",
};

const UPDATED = "2026-10-25";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-10-25" -> "25 October 2026". Pure, no Date object; returns the input when it is not an ISO date. */
function formatLegalDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return isoDate;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

/** UI strings around the legal texts. */
export const legalUi = {
  /** Eyebrow above the h1 of every legal page. */
  eyebrow: "Legal",
  /** e.g. "Last updated 25 October 2026". */
  lastUpdated: (isoDate: string) => `Last updated ${formatLegalDate(isoDate)}`,
  /** Label before the date, and the date on its own, for a split layout. */
  lastUpdatedLabel: "Last updated",
  formatDate: (isoDate: string) => formatLegalDate(isoDate),
  /** Accessible label for the review notice. */
  reviewNoticeLabel: "Draft, legal review pending",
  /** Visible label in front of the Dutch review notice. */
  reviewNoticeTag: "Draft",
  contentsLabel: "On this page",
  /** e.g. "21 sections", next to the collapsed contents on phones. */
  contentsCount: (count: number) => (count === 1 ? "1 section" : `${count} sections`),
  /** Label of the drafting notes (`check` blocks). */
  checkLabel: "Legal check",
  /** Links to the other legal pages at the end of each page. */
  relatedLabel: "More legal information",
  /** Pages listed under relatedLabel, in this order; the current page is left out. */
  related: [
    { label: "Privacy Policy", href: legalRoutes.privacy },
    { label: "Terms & Conditions", href: legalRoutes.terms },
    { label: "Cookie Policy", href: legalRoutes.cookies },
    { label: "Legal notice", href: legalRoutes.legalNotice },
    { label: "Shipping & Returns", href: "/shipping-returns" },
  ],
};

/* ------------------------------------------------------------------ */
/* Shared facts and helpers                                            */
/* ------------------------------------------------------------------ */

function joinList(items: string[], last = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

function sub(text: string): LegalBlock {
  return { kind: "subheading", text };
}

function list(items: string[], ordered = false): LegalBlock {
  return ordered ? { kind: "list", items, ordered } : { kind: "list", items };
}

function factList(rows: [label: string, text: string][]): LegalBlock {
  return { kind: "facts", items: rows.map(([label, text]) => ({ label, text })) };
}

function check(text: string): LegalBlock {
  return { kind: "check", text };
}

/** site.company keeps its label in the value ("KvK: ..."); the definition lists label it themselves. */
function stripLabel(value: string, label: string): string {
  return value.startsWith(`${label}: `) ? value.slice(label.length + 2) : value;
}

const company = site.company;
const email = company.email;
const emailLink = `[${email}](mailto:${email})`;
const kvkNumber = stripLabel(company.kvk, "KvK");
const vatNumber = stripLabel(company.vat, "VAT");

const withdrawalDays = offers.withdrawalDays;
const guaranteeDays = offers.guaranteeDays;
const price1 = formatMoney(offers.stickPricing[1]);
const price2 = formatMoney(offers.stickPricing[2]);
const price3 = formatMoney(offers.stickPricing[3]);
const giftCardAmounts = joinList(offers.giftCardDenominations.map((amount) => formatMoneyShort(amount)), "or");
const paymentMethods = joinList(site.paymentMethods.map((method) => method.label));
const intervals = joinList(offers.subscription.intervalsMonths.map(String), "or");
const transitLine = joinList(facts.transit.map((entry) => entry.text));
const analyticsOn = site.analytics.enabled;
const cooldownDays = site.emailCapture.cooldownDays;

const shippingLine = facts.sameTermsEverywhere
  ? `Shipping to ${facts.countryNames} costs ${facts.shippingRate} per order and is free from ${facts.freeShippingFrom}.`
  : `Shipping costs per country are shown in the cart and on the [Shipping & Returns](/shipping-returns) page. Shipping is free from ${facts.freeShippingFrom}.`;

const demoLine = "This is a demo store. No orders are processed, nothing ships and no payment is taken.";

/** Identity rows shared by the Terms (article 1) and the Legal notice. */
const companyRows: [string, string][] = [
  ["Name", company.legalName],
  ["Address", company.address],
  ["Chamber of Commerce (KvK)", kvkNumber],
  ["VAT number", vatNumber],
  ["Email", emailLink],
  ["Phone", "(placeholder)"],
];

/** Labels of the processing rows in the Privacy Policy. */
const P = {
  data: "Data",
  why: "Why",
  basis: "Legal basis",
  kept: "Kept for",
} as const;

/* ------------------------------------------------------------------ */
/* Privacy Policy                                                      */
/* ------------------------------------------------------------------ */

const privacy: LegalPage = {
  title: "Privacy Policy",
  description:
    "How CORVANE handles personal data: what we collect and why, how long we keep it, who we share it with and your rights under the GDPR.",
  reviewNotice: legalReviewNotice,
  intro:
    "What personal data CORVANE collects, why, how long we keep it and what your rights are. In short: we collect what we need to run the shop, we never sell it, and analytics only runs with your permission.",
  updated: UPDATED,
  sections: [
    {
      id: "who-we-are",
      heading: "Who we are",
      body: [
        `${company.legalName} is the controller for the personal data in this policy. That means we decide why and how it is used.`,
        factList([
          ["Name", company.legalName],
          ["Address", company.address],
          ["Chamber of Commerce (KvK)", kvkNumber],
          ["Email", emailLink],
        ]),
        "We have not appointed a data protection officer. Questions about your data go to the email address above.",
        `${demoLine} The sign-up and contact forms check what you enter, but nothing is stored or sent. This policy describes how the shop handles data once it is live.`,
      ],
    },
    {
      id: "what-we-collect",
      heading: "What we collect and why",
      body: [
        "For each purpose: the data, why we need it, the legal basis under the General Data Protection Regulation (GDPR) and how long we keep it.",

        sub("Orders"),
        factList([
          [
            P.data,
            "Name, delivery address, email address, the products you order, the prices and discount code, and the payment and delivery status.",
          ],
          [
            P.why,
            "To process and deliver your order, send order and shipping emails, handle returns, withdrawals and guarantee claims, and keep our accounts.",
          ],
          [
            P.basis,
            "Performance of the contract (Article 6(1)(b) GDPR). For our accounts: a legal obligation (Article 6(1)(c) GDPR).",
          ],
          [P.kept, "7 years after the order, because Dutch tax law requires it."],
        ]),

        sub("Payment"),
        factList([
          [
            P.data,
            "Payment method, amount, payment status and a payment reference. We do not see or store your full card or bank details.",
          ],
          [P.why, "To take payment and to refund you when needed."],
          [P.basis, "Performance of the contract."],
          [P.kept, "As order data: 7 years."],
        ]),
        "The payment itself is handled by our payment provider (placeholder), under its own privacy statement.",

        sub("Subscribe & save"),
        factList([
          [
            P.data,
            "The products in your subscription, the interval you chose and the date of your next delivery. Recurring payments use an authorisation held by the payment provider.",
          ],
          [P.why, "To ship and bill each delivery, and to let you cancel."],
          [P.basis, "Performance of the contract."],
          [P.kept, "While the subscription runs. The orders it creates are kept as order data."],
        ]),

        sub("Newsletter and welcome code"),
        "This covers the sign-up form in the footer and the sign-up window with the cards.",
        factList([
          [
            P.data,
            "Your email address, when and where you signed up (footer or sign-up window), and whether you used the welcome code.",
          ],
          [
            P.why,
            "To send CORVANE emails about product news, new scents and offers, and to give the welcome code once per person.",
          ],
          [
            P.basis,
            "Your consent (Article 6(1)(a) GDPR). There is no pre-ticked box: the form says what you sign up for, and signing up is your consent.",
          ],
          [
            P.kept,
            "Until you unsubscribe. After that we keep only your email address on a suppression list, so we never email you again by mistake.",
          ],
        ]),
        "Every email has an unsubscribe link. Unsubscribing never affects an order.",

        sub("Contact form and email"),
        factList([
          [P.data, "Your name, email address, order number if you give one, and your message."],
          [P.why, "To answer your question."],
          [
            P.basis,
            "Performance of the contract when your question is about an order. Otherwise our legitimate interest in answering questions (Article 6(1)(f) GDPR).",
          ],
          [P.kept, "Up to 12 months after your question is handled (placeholder)."],
        ]),

        sub("Review invitations (planned)"),
        factList([
          [P.data, "Your name, email address and the products you bought."],
          [P.why, "To ask you once, after delivery, whether you want to review what you bought. Only buyers are invited."],
          [P.basis, "Our legitimate interest in showing genuine reviews. You can opt out in the invitation."],
          [P.kept, "Until the invitation is sent, or until you opt out (placeholder)."],
        ]),
        check("Confirm the basis for review invitations (consent or existing-customer exception) once the review app is chosen."),

        sub("Website and security logs"),
        factList([
          [P.data, "IP address, date and time, the page requested, and your browser and device type."],
          [P.why, "To keep the site secure and running, and to find and fix errors."],
          [P.basis, "Our legitimate interest in a secure site that works."],
          [P.kept, "Up to 30 days (placeholder)."],
        ]),

        sub("Analytics (only with your consent)"),
        factList([
          [
            P.data,
            "Pages visited, how the site is used, device and browser type, and an approximate location based on a shortened IP address.",
          ],
          [P.why, "To see which pages work and improve the shop."],
          [P.basis, "Your consent. Nothing loads until you agree."],
          [P.kept, "Up to 14 months (placeholder)."],
        ]),
        analyticsOn
          ? "You can change your choice any time via Cookie settings in the footer."
          : "Analytics is switched off on this site, so none of this data is collected.",

        sub("Customer accounts"),
        "Accounts are not available yet. This policy is updated before they are.",
      ],
    },
    {
      id: "required",
      heading: "What you have to give us",
      body: [
        "To place an order we need your name, delivery address and email address. Without them we cannot confirm or deliver your order.",
        "Everything else is up to you. Signing up for emails is never a condition for buying.",
      ],
    },
    {
      id: "on-your-device",
      heading: "Storage on your device",
      body: [
        "The shop keeps your cart, your delivery country and a few settings in your browser's storage. That data stays on your device; we do not receive it while you browse.",
        "When you go to checkout, the products in your cart, your discount code and your country are sent to create the checkout.",
        "What is stored and why is listed in the [Cookie Policy](/cookie-policy).",
        "Fonts are served from our own domain, so loading a page does not send your IP address to a font service. Links to Instagram and TikTok are plain links: nothing from those platforms loads on this site.",
      ],
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      body: [
        "We do not sell your data and do not share it for advertising.",
        sub("Processors"),
        "These companies process data on our behalf, under a data processing agreement, and only as we instruct:",
        list([
          "Hosting provider (placeholder): runs the site and keeps the security logs.",
          "Email service (placeholder): sends order emails and, if you signed up, our newsletter.",
          "Customer service tool (placeholder): stores messages from the contact form and email.",
          "Analytics provider (placeholder): only when analytics is switched on and you agreed.",
        ]),
        sub("Independent parties"),
        "These companies use data under their own responsibility, and only as far as your order needs:",
        list([
          "Payment provider (placeholder): processes your payment.",
          "Carrier (placeholder): receives your name, address and email address to deliver your parcel and send tracking updates.",
          "Accountant (placeholder): sees order and invoice data for our accounts.",
        ]),
        "We share data with authorities only when the law requires it.",
      ],
    },
    {
      id: "outside-eea",
      heading: "Outside the European Economic Area",
      body: [
        "We prefer providers that keep data in the European Economic Area (EEA). If a provider processes data outside the EEA, we only allow that with an adequacy decision of the European Commission, such as the EU-US Data Privacy Framework, or with the Commission's standard contractual clauses.",
        "Which providers this concerns, and the safeguard for each, is listed here before the shop goes live (placeholder).",
      ],
    },
    {
      id: "security",
      heading: "Security",
      body: [
        "We protect your data with appropriate technical and organisational measures: encrypted connections, access only for people who need it, and an agreement with every processor.",
        "If a data breach puts your rights at risk, we tell you and the Autoriteit Persoonsgegevens, as the law requires.",
        "We do not make decisions about you by automated means alone, and we do not profile you.",
      ],
    },
    {
      id: "your-rights",
      heading: "Your rights",
      body: [
        "Under the GDPR you have these rights:",
        list([
          "Access: see the personal data we hold about you.",
          "Rectification: have it corrected if it is wrong.",
          "Erasure: have it deleted.",
          "Restriction: have its use limited for a time, for example while we check a correction.",
          "Objection: object to use based on our legitimate interest. You can object to direct marketing at any time, without giving a reason.",
          "Portability: receive the data you gave us in a common format, or have it sent to another company.",
          "Withdrawing consent: where we rely on your consent, you can withdraw it at any time. That does not affect what we did before.",
        ]),
        `To use a right, email ${emailLink}. We may ask you to confirm who you are, so we never give your data to someone else.`,
        "We answer within one month. For a complex request we may need two more months; if so, we tell you within the first month. It costs you nothing.",
        "Some data we must keep by law, such as invoices. We keep that data even if you ask us to delete it, and tell you why.",
      ],
    },
    {
      id: "complaints",
      heading: "Complaints",
      body: [
        "Not happy with how we handle your data? Tell us first, so we can put it right.",
        "You can also complain to the Dutch Data Protection Authority, the [Autoriteit Persoonsgegevens](https://www.autoriteitpersoonsgegevens.nl). If you live in Belgium, you can also go to the Belgian Data Protection Authority, the [Gegevensbeschermingsautoriteit](https://www.gegevensbeschermingsautoriteit.be).",
      ],
    },
    {
      id: "children",
      heading: "Children",
      body: [
        "The shop is not aimed at anyone under 16. We do not knowingly collect their data. If you think a child has given us data, tell us and we delete it.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      body: [
        "We update this policy when the shop or the law changes. The date at the top shows the current version.",
        "If a change affects how we use data you already gave us, we tell you before it applies.",
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Terms & Conditions                                                  */
/* ------------------------------------------------------------------ */

/**
 * Article numbers the Terms refer to, with the section id each one must have.
 * Checked below when the module loads, so reordering the sections fails loudly.
 */
const ART = {
  who: 1,
  subscriptions: 7,
  withdrawal: 11,
  conformity: 13,
  usingProducts: 16,
  law: 20,
} as const;

const ART_IDS: Record<keyof typeof ART, string> = {
  who: "who-we-are",
  subscriptions: "subscriptions",
  withdrawal: "withdrawal",
  conformity: "conformity",
  usingProducts: "using-products",
  law: "law",
};

const terms: LegalPage = {
  title: "Terms & Conditions",
  description: `The terms for buying from CORVANE: prices, bundles, discount codes, subscriptions, payment, delivery, your ${withdrawalDays}-day right of withdrawal and the separate ${guaranteeDays}-day guarantee.`,
  reviewNotice: legalReviewNotice,
  intro:
    "The terms for buying from CORVANE. They apply to every order placed on this site. Your statutory rights as a consumer always apply as well; nothing here limits them.",
  updated: UPDATED,
  numbered: true,
  sections: [
    {
      id: "who-we-are",
      heading: "Who we are",
      body: [
        "These terms are used by:",
        factList(companyRows),
        `You can reach us by email, through the [contact form](/contact) or by phone. We answer on working days.`,
        demoLine,
      ],
    },
    {
      id: "scope",
      heading: "When these terms apply",
      body: [
        `These terms apply to every offer on this site and to every order a consumer places with us for delivery in ${facts.countryNames}.`,
        "You can read, save and print them before you order. We also send them with your order confirmation.",
      ],
    },
    {
      id: "offer",
      heading: "Products and offer",
      body: [
        "We describe our products as accurately as we can. Until photos are ready, product images are renders, so the real product may differ slightly in colour.",
        "If an offer contains an obvious mistake, such as a clearly wrong price, it does not bind us. We tell you as soon as we notice, and you can cancel at no cost.",
        `If a product turns out to be unavailable after you order, we tell you and refund what you paid for it within ${withdrawalDays} days.`,
      ],
    },
    {
      id: "prices",
      heading: "Prices",
      body: [
        "All prices are in euros and include VAT.",
        `${shippingLine} The shipping cost and the total are shown before you place your order.`,
        "Savings on bundles are shown against the single-stick price. We only show a crossed-out earlier price if it was the lowest price we charged in the 30 days before the discount.",
        `We may change prices for future orders. The price shown when you place your order is the price you pay. For subscriptions, see article ${ART.subscriptions}.`,
      ],
    },
    {
      id: "bundles",
      heading: "Bundle pricing and the free Travel Pouch",
      body: [
        `One stick costs ${price1}, two cost ${price2} and three cost ${price3}. You can mix scents.`,
        "The cart groups sticks automatically, per purchase type (one-time or subscription): every three at the 3-stick price, a remainder of two at the 2-stick price and a remainder of one at the 1-stick price.",
        "The Discovery Set, the Travel Pouch and e-gift cards are not part of bundle pricing.",
        `With ${offers.freePouch.minSticks} or more sticks in an order, one Travel Pouch is free (one per order).`,
        `If you withdraw from part of a set, you get back that part's share of the set price you paid (article ${ART.withdrawal}). The free Travel Pouch is yours to keep.`,
      ],
    },
    {
      id: "discount-codes",
      heading: "Discount codes",
      body: [
        list([
          "One code per order. Codes cannot be combined.",
          "Codes do not apply to e-gift cards and cannot be exchanged for cash.",
          "A code is valid only in the period stated with it. The welcome code is for a first order.",
          "Bundle prices and the Subscribe & save discount are not codes. They apply first; a code applies to the result.",
          `The free-shipping threshold of ${facts.freeShippingFrom} counts the products that ship, before any code.`,
        ]),
        "If you withdraw from an order that used a code, we refund what you actually paid.",
      ],
    },
    {
      id: "subscriptions",
      heading: "Subscribe & save",
      body: [
        `With Subscribe & save you get ${offers.subscription.discountPercent}% off every delivery. You choose the scents and a delivery every ${intervals} months.`,
        "Each delivery is billed when it ships, at the subscription price that applies at that moment.",
        "You can cancel any time before your next delivery, online and as easily as you signed up. No fee, no minimum term. A delivery that has already shipped stays an order of its own, with its own right of withdrawal.",
        "If we change the subscription price, we tell you at least 30 days before it applies (placeholder). You can cancel before then at no cost.",
        `The right of withdrawal for a subscription starts after the first delivery (article ${ART.withdrawal}).`,
        "Recurring billing is connected when the shop goes live. Until then, no payment is taken.",
        check("Confirm the online cancellation flow and the notice period for price changes before the shop goes live."),
      ],
    },
    {
      id: "ordering",
      heading: "Your order and the contract",
      body: [
        "You can check and correct your order at every step of the checkout. The last step makes clear that placing the order means you have to pay.",
        "The contract is formed when you place your order. We confirm receipt by email without delay. Until we have confirmed it, you can cancel the order.",
        "We may refuse or cancel an order for a good reason, such as suspected fraud or misuse of discount codes. If we do, we tell you without delay and refund anything you paid.",
      ],
    },
    {
      id: "payment",
      heading: "Payment",
      body: [
        `You can pay with ${paymentMethods}. Payments are processed by our payment provider (placeholder).`,
        "You pay when you place your order. For a subscription, each delivery is paid when it ships.",
        "If a payment fails, we let you know. The order ships once it is paid.",
        check("Confirm the advance payment wording for consumers at checkout."),
      ],
    },
    {
      id: "delivery",
      heading: "Delivery",
      body: [
        `We deliver to ${facts.countryNames}. E-gift cards are delivered by email.`,
        `Orders placed on a working day before ${facts.cutoff} (${facts.timeZoneLabel}) ship the same day; other orders ship the next working day. Delivery takes ${transitLine} after dispatch.`,
        "Delivery times are estimates. We deliver within 30 days of your order at the latest. If we cannot, we tell you, and you can cancel at no cost and get a refund without delay.",
        "If a parcel comes back to us because the address was wrong or incomplete, we contact you to arrange a new delivery.",
        "The risk of loss or damage passes to you when you, or someone you name, receive the order.",
      ],
    },
    {
      id: "withdrawal",
      heading: "Right of withdrawal",
      body: [
        `You can withdraw from your purchase within ${withdrawalDays} days, without giving a reason.`,
        `The ${withdrawalDays} days start the day after you, or someone you name (other than the carrier), receive the order. For an order in several parcels, they start after the last parcel. For a subscription, they start after the first delivery.`,
        sub("How to withdraw"),
        list(
          [
            `Tell us within ${withdrawalDays} days, by email to ${emailLink}. A clear statement is enough. You can use the [model withdrawal form](/shipping-returns#withdrawal), but you do not have to.`,
            `Send the items back within ${withdrawalDays} days of telling us.`,
          ],
          true,
        ),
        sub("Refund"),
        `We refund everything you paid, including the standard shipping cost, within ${withdrawalDays} days of receiving your withdrawal. We use the payment method you used, unless you agree to something else.`,
        "We may wait with the refund until we have the items back, or until you show that you have sent them, whichever comes first.",
        "Withdrawing from part of a set? You get back that part's share of the set price you paid. The free Travel Pouch is yours to keep.",
        sub("Costs and condition"),
        "You pay the direct cost of returning the items.",
        "Handle the items only as far as needed to see what they are, as you would in a shop. If they lose value because you handled them more than that, we may deduct that loss from the refund.",
      ],
    },
    {
      id: "withdrawal-exceptions",
      heading: "Exceptions to the right of withdrawal",
      body: [
        "The right of withdrawal does not apply to sealed goods that are not suitable for return for health or hygiene reasons, once you have unsealed them after delivery. Our sticks and mini sticks are delivered sealed for this reason. Sealed items can always be returned within the withdrawal period.",
        check("This exception only holds if sticks and mini sticks are actually delivered sealed and customers are told before they order."),
        `E-gift cards: you can withdraw within ${withdrawalDays} days of purchase, as long as the card has not been used.`,
        `Opened a stick and it is not for you? The ${guaranteeDays}-day guarantee in the next article covers that.`,
      ],
    },
    {
      id: "conformity",
      heading: "Conformity: your statutory rights",
      body: [
        "Our products must match the agreement and be fit for normal use. That is your statutory right, and nothing in these terms limits it.",
        "If a product is faulty, damaged or not what you ordered, email us with your order number and a photo. Tell us within two months of discovering the problem; that is always in time.",
        "We send a replacement or refund you, and we cover the costs, including return shipping.",
        "In the Netherlands, a fault that appears within one year of delivery is presumed to have been there at delivery. In Belgium that period is two years, and the legal guarantee runs for at least two years from delivery.",
      ],
    },
    {
      id: "guarantee",
      heading: `${guaranteeDays}-day guarantee`,
      body: [
        `On top of your statutory rights, CORVANE gives a voluntary ${guaranteeDays}-day guarantee. It comes in addition to the right of withdrawal and your rights under article ${ART.conformity}, and does not replace or limit them.`,
        `If a product is not right for you, tell us within ${guaranteeDays} days of delivery, even if you have opened and used it. Send it back and we refund what you paid for that product, or swap it for another scent.`,
        list([
          `Applies to sticks, mini sticks, the Discovery Set and the Travel Pouch bought in this shop and delivered in ${facts.countryNames}. Not to e-gift cards.`,
          "One claim per item.",
          "You pay the cost of return shipping.",
          `We refund within ${withdrawalDays} days of receiving the product, with the payment method you used.`,
        ]),
        `How to claim: email ${emailLink} with your order number and the product. The steps are on the [Shipping & Returns](/shipping-returns#guarantee) page.`,
        `The guarantee is given by ${company.legalName}, at the address in article ${ART.who}.`,
      ],
    },
    {
      id: "gift-cards",
      heading: "E-gift cards",
      body: [
        `E-gift cards come in ${giftCardAmounts} and are delivered by email.`,
        "An e-gift card is valid for (placeholder: term, at least one year) from the date of purchase. The end date is shown on the card.",
        check("Confirm the validity term for the Netherlands and Belgium."),
        "You can use it for products in this shop, over one or more orders, but not for other gift cards. Any balance stays on the card. It cannot be exchanged for cash.",
        "Discount codes do not apply to the purchase of a gift card.",
        "Keep the code safe: anyone who has it can use it. If the email gets lost, we send it again to the address it was bought with.",
        "Redeeming a gift card at checkout becomes available when the shop goes live.",
      ],
    },
    {
      id: "using-products",
      heading: "Using our products",
      body: [
        "Apply to clean, unbroken skin. Do not use on irritated skin, and stop using a product if your skin reacts.",
        "Check the ingredient list on the product page and the packaging if you have an allergy.",
        "Keep out of reach of children. Store away from heat: the wax base melts at skin temperature.",
      ],
    },
    {
      id: "liability",
      heading: "Liability",
      body: [
        "Our liability is limited as far as the law allows. This never limits your statutory rights as a consumer, our liability under product liability law, or our liability for intent or gross negligence.",
        `We are not liable for damage caused by using a product against the instructions in article ${ART.usingProducts}.`,
      ],
    },
    {
      id: "personal-data",
      heading: "Personal data",
      body: ["We handle your personal data as described in our [Privacy Policy](/privacy-policy)."],
    },
    {
      id: "complaints",
      heading: "Complaints and disputes",
      body: [
        `Something not right? Email ${emailLink} with your order number and what went wrong. We confirm that we have your complaint and answer within 14 days. If we need longer, we tell you within those 14 days when to expect an answer.`,
        `If we cannot solve it together, you can take the dispute to the competent court (article ${ART.law}).`,
        "Consumers in Belgium can also contact the Consumer Mediation Service, the [Consumentenombudsdienst](https://consumentenombudsdienst.be). For a dispute with a shop in another EU country, the European Consumer Centre in your country can help.",
        check("Confirm the dispute options for consumers in the Netherlands and Belgium."),
      ],
    },
    {
      id: "law",
      heading: "Applicable law and courts",
      body: [
        "Dutch law applies to these terms and to every order.",
        "If you live in Belgium, you keep the protection of the mandatory consumer rules of Belgian law.",
        "You can take a dispute to the competent court where you live or where we are based. We can only take you to court where you live.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      body: [
        "We may change these terms. The version that applied when you placed your order stays in force for that order.",
        "For a running subscription, we tell you about a change at least 30 days before it applies (placeholder), and you can cancel before then at no cost.",
      ],
    },
  ],
};

for (const key of Object.keys(ART) as (keyof typeof ART)[]) {
  if (terms.sections[ART[key] - 1]?.id !== ART_IDS[key]) {
    throw new Error(`content/legal.ts: Terms article ${ART[key]} must be "${ART_IDS[key]}". Update ART after reordering.`);
  }
}

/* ------------------------------------------------------------------ */
/* Cookie Policy                                                       */
/* ------------------------------------------------------------------ */

/** Session storage key of the email capture pill (components/email/state.ts). */
const PILL_DISMISSED_KEY = storageKeys.emailCapturePillDismissed;

const keptLocally = "Kept in local storage until you clear it.";

/**
 * One row per entry: what it is for (the label), then the key name and what
 * it stores, on separate lines ("\n").
 */
const storageRows: [string, string][] = [
  ["Cart", `\`${storageKeys.cart}\`\nThe products in your cart and the discount code you added. ${keptLocally}`],
  [
    "Delivery country",
    `\`${storageKeys.country}\`\nThe delivery country you picked, so shipping costs and delivery estimates are right. ${keptLocally}`,
  ],
  [
    "Sign-up window",
    `\`${storageKeys.emailCaptureLastShown}\`\nWhen the sign-up window last opened by itself, so it opens at most once every ${cooldownDays} days. ${keptLocally}`,
  ],
  [
    "Signed up",
    `\`${storageKeys.emailCaptureSubscribed}\`\nThat you signed up on this device, so the sign-up window does not open again. Not your email address. ${keptLocally}`,
  ],
  [
    "Sign-up button",
    `\`${PILL_DISMISSED_KEY}\`\nThat you hid the sign-up button during this visit. Kept in session storage until you close the tab.`,
  ],
  ...(analyticsOn
    ? ([
        [
          "Analytics choice",
          `\`${storageKeys.consent}\`\nYour answer to the analytics question and when you gave it, so we do not ask on every visit. Kept in local storage until you change your choice or clear it.`,
        ],
      ] satisfies [string, string][])
    : []),
];

const cookies: LegalPage = {
  title: "Cookie Policy",
  description:
    "What CORVANE stores on your device and why. Functional storage for the cart and a few settings; no analytics without your permission.",
  reviewNotice: legalReviewNotice,
  intro: "What this site stores on your device and why. By default, only what the shop needs to work. No analytics without your permission.",
  updated: UPDATED,
  sections: [
    {
      id: "in-short",
      heading: "In short",
      body: [
        list([
          "The shop stores a few functional settings in your browser, such as your cart.",
          "Nothing is sent to us or to anyone else while you browse.",
          "No advertising cookies and no social media pixels.",
          analyticsOn ? "Analytics only runs after you say yes." : "No analytics: it is switched off on this site.",
        ]),
      ],
    },
    {
      id: "cookies-and-storage",
      heading: "Cookies and browser storage",
      body: [
        "Cookies are small files a website stores in your browser. Local storage and session storage do the same job in a different way: they keep information in your browser, on your device. The law treats them the same way, so this policy covers all three.",
        "This site does not set cookies of its own. It uses local storage and session storage, listed below.",
      ],
    },
    {
      id: "what-we-store",
      heading: "What we store and why",
      body: [
        "These entries are needed for the shop to work the way you ask it to. Under Dutch and Belgian law, that kind of storage does not need your consent. None of it contains your name or email address.",

        factList(storageRows),
        check("Confirm that the sign-up window entries count as functional storage that needs no consent."),
      ],
    },
    {
      id: "analytics",
      heading: "Analytics",
      body: [
        "Analytics shows us how the site is used, such as which pages people visit. It only runs when two things are true: we have switched it on, and you said yes in the cookie banner. Until you choose, nothing loads. Saying no is as easy as saying yes.",
        analyticsOn
          ? "Analytics is switched on. You can change your choice any time via Cookie settings in the footer."
          : "Right now analytics is switched off on this site. There is no cookie banner, and no analytics cookies or storage are used.",
        "Before analytics is switched on, this page lists the provider (placeholder), the cookies it sets and how long they are kept.",
      ],
    },
    {
      id: "other-parties",
      heading: "Other parties",
      body: [
        "We do not use advertising cookies, social media pixels or tracking for other companies.",
        "Fonts are served from our own domain. Links to Instagram and TikTok are plain links: nothing from those platforms loads here.",
        "Once the shop is live, the checkout of our payment provider (placeholder) may set its own functional cookies to complete your payment. Its own cookie policy applies there.",
      ],
    },
    {
      id: "managing",
      heading: "Clearing or blocking storage",
      body: [
        "You can clear or block cookies and site storage in your browser settings at any time. The shop still works, but your cart is emptied, your country goes back to the default and the sign-up window may open again.",
        ...(analyticsOn ? ["To change only your analytics choice, use Cookie settings in the footer."] : []),
      ],
    },
    {
      id: "questions",
      heading: "Questions",
      body: [`Email ${emailLink}. How we handle personal data is explained in the [Privacy Policy](/privacy-policy).`],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Legal notice                                                        */
/* ------------------------------------------------------------------ */

const legalNotice: LegalPage = {
  title: "Legal notice",
  description: "Company details for CORVANE: who runs this shop, where we are registered and how to reach us.",
  reviewNotice: legalReviewNotice,
  intro: "Who runs this site and how to reach us.",
  updated: UPDATED,
  sections: [
    {
      id: "company",
      heading: "Company details",
      body: [
        factList([
          ...companyRows.slice(0, 1),
          ["Legal form", "Besloten vennootschap (B.V.), a Dutch private limited company"],
          ...companyRows.slice(1),
          ["Managing director", "(placeholder)"],
        ]),
      ],
    },
    {
      id: "contact",
      heading: "Contact",
      body: [
        `For questions about an order, use the [contact form](/contact) or email ${emailLink}. We answer on working days.`,
        "How returns work is explained on the [Shipping & Returns](/shipping-returns) page.",
      ],
    },
    {
      id: "demo",
      heading: "Demo store",
      body: [
        `${demoLine} CORVANE is a fictional brand.`,
        "The company details on this page are placeholders until the company is registered.",
      ],
    },
    {
      id: "rights",
      heading: "Text, images and trademarks",
      body: [
        "All text, product renders, the CORVANE wordmark and the vane icon were made for CORVANE. Do not reuse them without permission.",
        "Product images are renders and placeholders until photos are ready.",
        "Trademark registration: (placeholder).",
      ],
    },
    {
      id: "links",
      heading: "Links to other sites",
      body: ["We are not responsible for the content of other websites we link to."],
    },
  ],
};

export const legal: Record<LegalPageId, LegalPage> = {
  privacy,
  terms,
  cookies,
  legalNotice,
};

/**
 * Points a lawyer must check before launch, in addition to the full review
 * (docs/TODO-LAUNCH.md). Not shown on the site; the `check` blocks in the
 * texts mark where some of them apply.
 */
export const legalCheckpoints: string[] = [
  "Withdrawal exception for sealed cosmetics: only valid if sticks and mini sticks are actually delivered sealed and customers are told before ordering Wording on /shipping-returns, in Terms article 12 and in the product page accordion.",
  "E-gift cards: right of withdrawal while unused, and the validity term. Belgium requires at least one year with the end date on the voucher; confirm for the Netherlands (Terms article 15, product page).",
  "VAT on e-gift cards: usable in NL and BE, so probably multi-purpose vouchers, taxed when redeemed rather than when sold. The cart drawer leaves out \"Taxes included.\" for an order with only gift cards; confirm the treatment and any wording for gift cards in the cart, checkout and invoice.",
  "Partial withdrawal from a set: refund of that part's share of the set price; the free Travel Pouch stays with the customer (Terms articles 5 and 11, /shipping-returns).",
  "Subscriptions: online cancellation as easy as signing up, no minimum term, withdrawal period from the first delivery, notice period for price changes (placeholder: 30 days) (Terms articles 7 and 21).",
  "30-day guarantee: commercial guarantee requirements (Article 7:6a Dutch Civil Code): guarantor, scope, territory, duration and claim procedure; return costs and one claim per item (Terms article 14, /shipping-returns, homepage block).",
  "Advance payment: Article 7:26(2) Dutch Civil Code limits the advance payment that terms can require from a consumer. Confirm the checkout and Terms article 9 wording.",
  "Contract formation and confirmation: order confirmation by email with the terms attached (durable medium), and the order button wording (Terms articles 2 and 8).",
  "Conformity: presumption period one year in NL and two years in BE, and the minimum two-year legal guarantee in BE (Terms article 13).",
  "Liability clause: check against the grey list for consumer terms (Article 6:237 Dutch Civil Code) (Terms article 17).",
  "Complaints and disputes: CORVANE is not a member of a Dutch disputes committee (placeholder); Belgian Consumentenombudsdienst; the EU online dispute resolution platform has closed, so the Terms do not link to it (Terms article 19).",
  "Language: the site and these texts are in English only. Check whether a Dutch version, and for Belgium a French version, is needed.",
  "Review invitations: legal basis (consent or existing-customer exception under Article 11.7 Telecommunicatiewet) and opt-out (Privacy Policy).",
  "Email tool: opening and click tracking in emails needs consent or must be switched off; update the Privacy Policy to match the tool's settings.",
  "Retention periods marked as placeholder, the list of processors and independent parties (payment provider, carrier), and transfers outside the EEA with their safeguards (Privacy Policy).",
  "Functional storage: confirm that the sign-up window entries need no consent (Cookie Policy). When analytics is switched on, list the provider, its cookies and their retention.",
  "Model withdrawal form text on /shipping-returns (Annex I(B), Directive 2011/83/EU).",
];
