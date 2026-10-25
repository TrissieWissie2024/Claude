import { formatMoney } from "@/lib/money";
import type { FaqItem } from "@/lib/types";

import { offers } from "./offers";
import { facts, site } from "./site";

/**
 * Questions and answers (docs/PLAN.md §5). Amounts, days and times are derived
 * from content/offers.ts and content/shipping.ts.
 *
 * Rules: no performance claims (longevity, number of uses, airport rules); if a
 * question invites one, say honestly that it depends and that results follow.
 * The 14-day right of withdrawal is a legal right, never a perk, and the
 * 30-day guarantee is always described as something separate.
 */

const price1 = formatMoney(offers.stickPricing[1]);
const price2 = formatMoney(offers.stickPricing[2]);
const price3 = formatMoney(offers.stickPricing[3]);
const paymentList = site.paymentMethods.map((method) => method.label);
const payments = `${paymentList.slice(0, -1).join(", ")} and ${paymentList[paymentList.length - 1]}`;
const intervals = offers.subscription.intervalsMonths;
const intervalList = `${intervals.slice(0, -1).join(", ")} or ${intervals[intervals.length - 1]}`;
const transit = facts.transit.map((entry) => entry.text).join(" and ");

export const faq: FaqItem[] = [
  /* Product ---------------------------------------------------------- */
  {
    id: "what-is-solid-cologne",
    category: "product",
    question: "What is solid cologne?",
    answer:
      "Cologne in solid form. The scent sits in a plant-based wax base with jojoba and coconut oil, which melts at skin temperature. No alcohol, no glass, no spray. It comes in a 15 g twist-up stick.",
    onHome: true,
  },
  {
    id: "how-to-apply",
    category: "product",
    question: "How do I apply it?",
    answer:
      "Twist it up a few millimetres. Two or three swipes over your wrists, neck and chest. Twist it back down and put the cap on. Apply to clean, unbroken skin.",
    onHome: true,
    onProduct: true,
  },
  {
    id: "how-long-does-it-last",
    category: "product",
    question: "How long does it last on skin?",
    answer:
      "It depends on your skin, the weather and how much you apply. We are still testing this properly and will publish the results once they are in. Until then we would rather say nothing than guess.",
    onProduct: true,
  },
  {
    id: "which-scent",
    category: "product",
    question: "Which scent should I pick?",
    answer:
      "Take the scent finder on the homepage: three questions, one suggestion. Still not sure? The Discovery Set has six 3 g mini sticks, one of each scent, so you can try them all first.",
    onHome: true,
  },
  {
    id: "ingredients",
    category: "product",
    question: "What is in it?",
    answer:
      "A plant-based wax base with jojoba and coconut oil, plus fragrance. Alcohol-free. The full INCI list per scent will be on each product page before the shop goes live. If your skin is sensitive, try a small area first.",
  },
  {
    id: "heat",
    category: "product",
    question: "Will it melt in my bag?",
    answer:
      "The wax base is made to melt at skin temperature, so it softens in heat. Keep the cap on and keep it out of direct sun and hot cars. If it has softened, let it cool before you twist it up.",
    onProduct: true,
  },
  {
    id: "travel",
    category: "product",
    question: "Can I take it when I travel?",
    answer:
      "It is a 15 g solid in a small aluminium tube, so it packs easily. Security rules differ per airport and change over time, so check the current rules for your trip before you fly.",
  },

  /* Ordering --------------------------------------------------------- */
  {
    id: "bundle-pricing",
    category: "ordering",
    question: "How does bundle pricing work?",
    answer: `One stick is ${price1}, two are ${price2} and three are ${price3}, with a free Travel Pouch (one per order). Mix scents as you like. The cart groups your sticks automatically: every three at the 3-stick price, the rest at the 2- or 1-stick price.`,
    onProduct: true,
  },
  {
    id: "payment-methods",
    category: "ordering",
    question: "How can I pay?",
    answer: `${payments}. Right now the shop runs as a demo: the checkout shows the full flow but takes no payment.`,
  },
  {
    id: "discount-codes",
    category: "ordering",
    question: "Can I combine discount codes?",
    answer:
      "No. One code per order, and codes do not apply to gift cards. Bundle prices and Subscribe & save are not codes, so they always apply.",
  },
  {
    id: "gift-cards",
    category: "ordering",
    question: "How do gift cards work?",
    answer:
      "The e-gift card is digital and delivered by email, so there is no shipping. Choose an amount; the person who gets it picks the scent.",
  },

  /* Shipping --------------------------------------------------------- */
  {
    id: "shipping-cost",
    category: "shipping",
    question: "Where do you ship and what does it cost?",
    answer: facts.sameTermsEverywhere
      ? `We ship to ${facts.countryNames}. Shipping is ${facts.shippingRate} and free from ${facts.freeShippingFrom}. Gift cards are delivered by email, so they never need shipping.`
      : `We ship to ${facts.countryNames}. Shipping starts at ${facts.shippingRate}, free from ${facts.freeShippingFrom}. Gift cards are delivered by email.`,
    onHome: true,
  },
  {
    id: "when-does-it-ship",
    category: "shipping",
    question: "When will my order ship?",
    answer: `Order on a working day before ${facts.cutoff} (${facts.timeZoneLabel}) and it ships the same day. Later than that, at the weekend or on a public holiday, it ships the next working day. Delivery takes ${transit}.`,
    onProduct: true,
  },

  /* Returns ---------------------------------------------------------- */
  {
    id: "right-of-withdrawal",
    category: "returns",
    question: "Can I return my order?",
    answer: `Yes. By law you have ${facts.withdrawalDays} days from delivery to withdraw from your purchase. Tell us within that period and send the items back; we refund you within ${facts.withdrawalDays} days of your withdrawal. The details, including what applies to opened products, are on the Shipping & Returns page.`,
  },
  {
    id: "guarantee",
    category: "returns",
    question: `What is the ${facts.guaranteeDays}-day guarantee?`,
    answer: `A voluntary extra, separate from your legal right of withdrawal. Not the right scent? Email us within ${facts.guaranteeDays} days of delivery and send it back, opened or not. We refund what you paid for it or swap it for another scent. Return postage is yours. One claim per item. E-gift cards excluded.`,
    onHome: true,
  },
  {
    id: "damaged-or-wrong",
    category: "returns",
    question: "My order arrived damaged or wrong. What now?",
    answer: `Email ${site.company.email} with your order number and a photo. We send a replacement or refund you, at no cost to you.`,
  },

  /* Subscription ----------------------------------------------------- */
  {
    id: "subscribe-and-save",
    category: "subscription",
    question: "How does Subscribe & save work?",
    answer: `Choose your sticks, pick a delivery every ${intervalList} months, and save ${facts.subscriptionPercent}% on every delivery. Bundle prices still apply, then the discount comes off each set. Each delivery is billed when it ships. Recurring billing is connected when the shop goes live; until then no payment is taken.`,
    onHome: true,
  },
  {
    id: "cancel-subscription",
    category: "subscription",
    question: "Can I cancel my subscription?",
    answer:
      "Yes. When subscriptions go live, you can cancel any time before your next delivery. No fee, no minimum term.",
  },
];
