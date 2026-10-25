import { formatMoney, formatMoneyShort } from "@/lib/money";
import { storageKeys } from "@/lib/storage";

import { offers } from "./offers";
import { facts, site } from "./site";

/**
 * Legal texts: Privacy Policy, Terms & Conditions, Cookie Policy and Legal
 * notice (docs/PLAN.md §1, brief §6). English drafts for a Dutch B.V. selling
 * to consumers in the Netherlands and Belgium.
 *
 * DRAFTS. Every legal page shows `legalReviewNotice` at the top until a lawyer
 * has checked the texts (docs/TODO-LAUNCH.md). Company details are marked
 * "(placeholder)" and come from site.company. Clauses that need a specific
 * check are marked "(Legal check: ...)" in the text and listed in
 * `legalCheckpoints`.
 *
 * Prices, days and times come from content/offers.ts and content/shipping.ts.
 * Checked by content/content-guard.test.ts.
 */

export type LegalPageId = "privacy" | "terms" | "cookies" | "legalNotice";

export interface LegalSection {
  heading: string;
  /** Paragraphs. */
  body: string[];
}

export interface LegalPage {
  title: string;
  /** Shown at the top of the page until a lawyer has checked the text (brief §6). Always legalReviewNotice. */
  reviewNotice: string;
  intro: string;
  /** ISO date (YYYY-MM-DD) of the last change. */
  updated: string;
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
  /** e.g. "Last updated 25 October 2026". */
  lastUpdated: (isoDate: string) => `Last updated ${formatLegalDate(isoDate)}`,
  /** Accessible label for the review notice. */
  reviewNoticeLabel: "Draft, legal review pending",
  contentsLabel: "On this page",
};

/* ------------------------------------------------------------------ */
/* Shared facts                                                        */
/* ------------------------------------------------------------------ */

function joinList(items: string[], last = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

const company = site.company;
const email = company.email;
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

const shippingLine = facts.sameTermsEverywhere
  ? `Shipping to ${facts.countryNames} costs ${facts.shippingRate} per order and is free from ${facts.freeShippingFrom}.`
  : `Shipping costs per country are shown in the cart and on the Shipping & Returns page, and shipping is free from ${facts.freeShippingFrom}.`;

const demoLine = "This is a demo store. No orders are processed, nothing ships and no payment is taken.";

/* ------------------------------------------------------------------ */
/* Privacy Policy                                                      */
/* ------------------------------------------------------------------ */

const privacy: LegalPage = {
  title: "Privacy Policy",
  reviewNotice: legalReviewNotice,
  intro:
    "What personal data CORVANE collects, why, how long we keep it and what your rights are. The short version: we collect what we need to run the shop, and analytics only with your permission.",
  updated: UPDATED,
  sections: [
    {
      heading: "Who we are",
      body: [
        `${company.legalName} is the controller for the personal data described in this policy.`,
        `Address: ${company.address}. ${company.kvk}. Email: ${email}.`,
        `${demoLine} The sign-up and contact forms are stubs: they check what you enter, but do not send your message or add you to a mailing list. This policy describes how the shop handles data once it is live.`,
      ],
    },
    {
      heading: "What we collect and why",
      body: [
        "Orders. Your name, delivery address, email address, the products you order and the payment status. We need this to deliver your order, send order emails and handle returns. Legal basis: performance of the contract (Article 6(1)(b) GDPR).",
        "Payment. Payments are handled by our payment provider (placeholder). We do not see or store your full card or bank details.",
        "Subscriptions. If you choose Subscribe & save, we also keep your delivery interval and next delivery date, so we can ship and bill each delivery. Legal basis: performance of the contract.",
        "Newsletter and welcome code. Your email address, and when and where you signed up. We use it to send CORVANE emails about product news, new scents and offers. Legal basis: your consent (Article 6(1)(a) GDPR). Every email has an unsubscribe link.",
        "Contact form. Your name, email address, order number (if you give one) and your message. We use it to answer you. Legal basis: our legitimate interest in answering questions (Article 6(1)(f) GDPR), or the contract when your question is about an order.",
        `Analytics. Only when analytics is switched on and only after you agree: which pages are visited, how the site is used, your type of device and browser, and an approximate location based on a shortened IP address. Legal basis: your consent. ${
          analyticsOn ? "You can change your choice any time via Cookie settings in the footer." : "Analytics is currently switched off on this site."
        }`,
        "Storage on your device. The shop keeps your cart, your country and a few settings in your browser's local storage. That data stays on your device. See the Cookie Policy.",
      ],
    },
    {
      heading: "Reviews",
      body: [
        "When the shop goes live, we plan to work with a review app (placeholder). After delivery, buyers may get one email asking for a review. Only verified buyers are invited. Legal basis: our legitimate interest in showing genuine reviews. You can object any time, and we will not ask again. (Legal check: confirm the basis for review invitations.)",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Order and invoice data: 7 years after the order, because Dutch tax law requires it (Article 6(1)(c) GDPR).",
        "Customer service messages: until your question is handled, then up to 12 months (placeholder).",
        "Newsletter: until you unsubscribe. After that we keep only your email address on a suppression list, so we do not email you again.",
        "Analytics data: up to 14 months (placeholder), and only if you agreed.",
        "Local storage: on your device, until you clear it.",
      ],
    },
    {
      heading: "Who we share it with",
      body: [
        "We do not sell your data. We share it only with companies that help us run the shop, under a data processing agreement:",
        "Hosting provider (placeholder). Payment provider (placeholder). Email service (placeholder). Carrier (placeholder): your name and address, to deliver your order. Analytics provider (placeholder): only with your consent.",
        "We also share data with authorities when the law requires it.",
      ],
    },
    {
      heading: "Outside the European Economic Area",
      body: [
        "Some providers may process data outside the European Economic Area. We only allow that with appropriate safeguards, such as the European Commission's standard contractual clauses. (Placeholder: list per provider before the shop goes live.)",
      ],
    },
    {
      heading: "Security",
      body: [
        "We protect your data with appropriate technical and organisational measures, such as encrypted connections and limited access to personal data.",
        "We do not use your data for automated decision-making or profiling.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You can ask to see, correct or delete your data, to restrict or object to its use, and to receive it in a portable format.",
        "Where we rely on your consent, you can withdraw it any time. That does not affect what happened before.",
        `Email ${email}. We answer within one month.`,
      ],
    },
    {
      heading: "Complaints",
      body: [
        "Not happy with how we handle your data? Tell us first, so we can fix it.",
        "You can also complain to the Dutch Data Protection Authority, the Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl). If you live in Belgium, you can also go to the Belgian Data Protection Authority, the Gegevensbeschermingsautoriteit (gegevensbeschermingsautoriteit.be).",
      ],
    },
    {
      heading: "Children",
      body: ["The shop is not aimed at anyone under 16. We do not knowingly collect their data."],
    },
    {
      heading: "Changes",
      body: ["We update this policy when the shop changes. The date at the top shows the current version."],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Terms & Conditions                                                  */
/* ------------------------------------------------------------------ */

const terms: LegalPage = {
  title: "Terms & Conditions",
  reviewNotice: legalReviewNotice,
  intro:
    "The terms for buying from CORVANE. They apply to every order placed on this site. Your statutory rights as a consumer always apply as well; nothing here limits them.",
  updated: UPDATED,
  sections: [
    {
      heading: "1. Who we are",
      body: [
        `${company.legalName}, ${company.address}. ${company.kvk}. ${company.vat}. Email: ${email}.`,
        demoLine,
      ],
    },
    {
      heading: "2. Scope",
      body: [
        `These terms apply to every offer on this site and to every order between CORVANE and consumers in ${facts.countryNames}.`,
        "You can read, save and print these terms before you order.",
      ],
    },
    {
      heading: "3. Offer and prices",
      body: [
        "All prices are in euros and include VAT.",
        `${shippingLine} The shipping cost is shown before you place your order.`,
        "We describe our products as accurately as we can. An obvious mistake in a price or description does not bind us. If that happens, we tell you and you can cancel at no cost.",
        "Campaigns and discount codes are valid for the period stated with them.",
      ],
    },
    {
      heading: "4. Bundle pricing",
      body: [
        `One stick costs ${price1}, two cost ${price2} and three cost ${price3}. You can mix scents.`,
        "The cart groups sticks automatically, per purchase type (one-time or subscription): every three at the 3-stick price, a remainder of two at the 2-stick price and a remainder of one at the 1-stick price.",
        "The Discovery Set, the Travel Pouch and e-gift cards are not part of bundle pricing.",
        `With ${offers.freePouch.minSticks} or more sticks in an order, one Travel Pouch is free (one per order).`,
      ],
    },
    {
      heading: "5. Discount codes",
      body: [
        "One code per order. Codes cannot be combined.",
        "Codes do not apply to e-gift cards and cannot be exchanged for cash.",
        "A code is valid only in the period stated with it. The welcome code is meant for a first order.",
        "Bundle prices and the Subscribe & save discount are not codes. They apply first; a code applies to the result.",
      ],
    },
    {
      heading: "6. Subscriptions (Subscribe & save)",
      body: [
        `With Subscribe & save you get ${offers.subscription.discountPercent}% off every delivery. You choose a delivery every ${intervals} months.`,
        "Each delivery is billed when it ships.",
        "You can cancel any time before your next delivery, online and as easily as you signed up. No fee, no minimum term. (Legal check: confirm the cancellation flow before the shop goes live.)",
        `The right of withdrawal for a subscription starts after the first delivery (see article 10).`,
        "Recurring billing is connected when the shop goes live. Until then, no payment is taken.",
      ],
    },
    {
      heading: "7. Ordering and the contract",
      body: [
        "You place an order by completing the checkout. The contract is formed when we confirm your order by email.",
        "We may refuse an order if there is a good reason, for example a suspected misuse of discount codes. If we do, we tell you and refund anything you paid.",
      ],
    },
    {
      heading: "8. Payment",
      body: [
        `You can pay with ${paymentMethods}. Payments are processed by our payment provider (placeholder).`,
        "You pay when you order. For a subscription, each delivery is paid when it ships.",
      ],
    },
    {
      heading: "9. Delivery",
      body: [
        `We deliver to ${facts.countryNames}.`,
        `Orders placed on a working day before ${facts.cutoff} (${facts.timeZoneLabel}) ship the same day; other orders ship the next working day. Delivery takes ${transitLine} after dispatch.`,
        `Delivery times are estimates. If we cannot deliver within 30 days of your order, we tell you and you can cancel at no cost. We then refund what you paid without delay.`,
        "The risk of loss or damage passes to you when you, or someone you name, receive the order.",
        "E-gift cards are delivered by email.",
      ],
    },
    {
      heading: "10. Right of withdrawal",
      body: [
        `You can withdraw from your purchase within ${withdrawalDays} days, without giving a reason. The ${withdrawalDays} days start the day after you, or someone you name (other than the carrier), receive the order. For an order in several parcels, they start after the last parcel. For a subscription, they start after the first delivery.`,
        `To withdraw, tell us by email (${email}) or use the model withdrawal form on the Shipping & Returns page. Then send the items back within ${withdrawalDays} days.`,
        `We refund everything you paid, including the standard shipping cost, within ${withdrawalDays} days of receiving your withdrawal. We may wait until we have the items back or you show that you have sent them, whichever comes first.`,
        "You pay the direct cost of returning the items.",
        "Handle the items only as far as needed to see what they are. If they lose value because you handled them more than that, we may deduct that loss from the refund.",
      ],
    },
    {
      heading: "11. Exceptions to the right of withdrawal",
      body: [
        "The right of withdrawal does not apply to sealed goods that are not suitable for return for health or hygiene reasons, once you have unsealed them after delivery. Our sticks and mini sticks are delivered sealed for this reason. Sealed items can always be returned within the withdrawal period. (Legal check: this exception only holds if the products are actually delivered sealed and you were told before ordering.)",
        `E-gift cards: you can withdraw within ${withdrawalDays} days of purchase, as long as the card has not been used. (Legal check: confirm.)`,
        `An opened stick that is not right for you is covered by the ${guaranteeDays}-day guarantee (article 13).`,
      ],
    },
    {
      heading: "12. Conformity",
      body: [
        "Our products must match the agreement and be fit for normal use. That is your statutory right, and nothing in these terms limits it.",
        "If a product is faulty, damaged or not what you ordered, email us with your order number and a photo. Tell us within two months of discovering the problem; that is always in time.",
        "We send a replacement or refund you, and we cover the costs, including return shipping.",
      ],
    },
    {
      heading: `13. ${guaranteeDays}-day guarantee`,
      body: [
        `On top of your statutory rights, CORVANE gives a voluntary ${guaranteeDays}-day guarantee. It comes in addition to the right of withdrawal and does not replace or limit it, or your rights under article 12.`,
        `If a product is not right for you, tell us within ${guaranteeDays} days of delivery, even if you have opened and used it. Send it back and we refund what you paid for that product, or swap it for another scent.`,
        "It applies to sticks, mini sticks, the Discovery Set and the Travel Pouch bought in this shop, not to e-gift cards. One claim per item. You pay the cost of return shipping.",
      ],
    },
    {
      heading: "14. E-gift cards",
      body: [
        `E-gift cards come in ${giftCardAmounts} and are delivered by email.`,
        "An e-gift card is valid for (placeholder: term) from the date of purchase. (Legal check: confirm the minimum term for NL and BE.)",
        "You can use it for products in this shop, not for other gift cards. It cannot be exchanged for cash. Any balance stays on the card.",
        "Discount codes do not apply to the purchase of a gift card.",
        "Redeeming a gift card at checkout becomes available when the shop goes live.",
      ],
    },
    {
      heading: "15. Use and liability",
      body: [
        "Use our products as described: apply to clean, unbroken skin, and stop using a product if your skin reacts.",
        "Our liability is limited as far as the law allows. This never limits your statutory rights as a consumer, or our liability for intent or gross negligence.",
      ],
    },
    {
      heading: "16. Complaints",
      body: [
        `Something not right? Email ${email} with your order number. We confirm that we have your complaint and aim to answer within 14 days.`,
        "If we cannot solve it together, you can take the dispute to the competent court. Consumers in Belgium can also contact the Consumer Mediation Service (Consumentenombudsdienst). (Legal check: confirm dispute options.)",
      ],
    },
    {
      heading: "17. Applicable law",
      body: [
        "Dutch law applies.",
        "If you live in Belgium, you keep the protection of the mandatory consumer rules of Belgian law.",
        "Disputes go to the competent court in the Netherlands, unless the law gives you the right to go to the court where you live.",
      ],
    },
    {
      heading: "18. Changes",
      body: ["We may change these terms. The version that applied when you placed your order stays in force for that order."],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Cookie Policy                                                       */
/* ------------------------------------------------------------------ */

const cookies: LegalPage = {
  title: "Cookie Policy",
  reviewNotice: legalReviewNotice,
  intro:
    "What this site stores on your device and why. By default, only what the shop needs to work. No analytics without your permission.",
  updated: UPDATED,
  sections: [
    {
      heading: "What we store by default",
      body: [
        "The shop uses your browser's local storage, which works much like a cookie, for functional data only. It stays on your device and is not sent to us.",
        `Cart (${storageKeys.cart}): the products in your cart and your discount code.`,
        `Country (${storageKeys.country}): the delivery country you picked.`,
        `Sign-up window (${storageKeys.emailCaptureLastShown} and ${storageKeys.emailCaptureSubscribed}): when the sign-up window last opened by itself and whether you signed up, so it does not keep coming back.`,
        `Consent choice (${storageKeys.consent}): your answer to the analytics question, so we do not ask again. Only used when analytics is switched on.`,
        "This storage is needed for the shop to work the way you expect, so it does not need your consent.",
      ],
    },
    {
      heading: "Analytics",
      body: [
        "Analytics shows us how the site is used, such as which pages people visit. It only runs when two things are true: we have switched it on, and you said yes in the cookie banner. Until you choose, nothing loads.",
        analyticsOn
          ? "Analytics is switched on. You can change your choice any time via Cookie settings in the footer."
          : "Right now analytics is switched off on this site. There is no banner, and no analytics cookies or storage are used.",
        "Before analytics is switched on, we list the provider (placeholder), its cookies and how long they are kept on this page.",
      ],
    },
    {
      heading: "No advertising cookies",
      body: [
        "We do not use advertising cookies, social media pixels or tracking for third parties.",
        "Once the shop is live, the payment provider's checkout may set its own functional cookies to complete your payment (placeholder).",
      ],
    },
    {
      heading: "Managing storage",
      body: [
        "You can clear local storage and cookies in your browser settings at any time. The shop still works, but your cart will be empty and the sign-up window may open again.",
      ],
    },
    {
      heading: "Questions",
      body: [`Email ${email}. How we handle personal data is explained in the Privacy Policy.`],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Legal notice                                                        */
/* ------------------------------------------------------------------ */

const legalNotice: LegalPage = {
  title: "Legal notice",
  reviewNotice: legalReviewNotice,
  intro: "Who runs this site and how to reach us.",
  updated: UPDATED,
  sections: [
    {
      heading: "Company",
      body: [company.legalName, company.address, company.kvk, company.vat, `Email: ${email}`, "Phone: (placeholder)"],
    },
    {
      heading: "Responsible for the content",
      body: [`(placeholder: name of the director), ${company.legalName}, address as above.`],
    },
    {
      heading: "Demo store",
      body: [
        `${demoLine} CORVANE is a fictional brand.`,
        "The company details on this page are placeholders until the company is registered.",
      ],
    },
    {
      heading: "Text and images",
      body: [
        "All text, product renders and designs on this site were made for CORVANE. Do not reuse them without permission.",
        "Product images are renders and placeholders. Photos follow before the shop goes live.",
      ],
    },
    {
      heading: "Links",
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
 * (docs/TODO-LAUNCH.md). Not shown on the site.
 */
export const legalCheckpoints: string[] = [
  "Withdrawal exception for sealed cosmetics: only valid if sticks and mini sticks are actually delivered sealed and customers are told before ordering. Wording on /shipping-returns and in Terms article 11.",
  "E-gift cards: right of withdrawal while unused, and the minimum validity term in NL and BE (Terms article 14).",
  "Partial withdrawal from a set: refund of that part's share of the set price; the free Travel Pouch stays with the customer.",
  "Subscriptions: cancellation flow online, as easy as signing up; withdrawal period from the first delivery (Terms article 6).",
  "30-day guarantee: scope, return costs and one claim per item (Terms article 13, /shipping-returns, homepage block).",
  "Review invitations: legal basis and opt-out (Privacy Policy).",
  "Retention periods marked as placeholder, processors and transfers outside the EEA (Privacy Policy).",
  "Complaints and dispute options for NL and BE consumers (Terms article 16).",
  "Model withdrawal form text on /shipping-returns (Annex I(B), Directive 2011/83/EU).",
];
