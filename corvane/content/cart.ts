import type { DiscountError } from "@/lib/types";

import { facts } from "./site";

/**
 * Cart drawer and demo checkout copy (docs/PLAN.md §10). Amounts arrive
 * already formatted with lib/money.ts. Checked by content/content-guard.test.ts.
 */

function sticks(count: number): string {
  return count === 1 ? "1 stick" : `${count} sticks`;
}

function months(count: number): string {
  return count === 1 ? "month" : `${count} months`;
}

export const cartCopy = {
  drawer: {
    title: "Your cart",
    close: "Close cart",
    itemCount: (count: number) => (count === 1 ? "1 item" : `${count} items`),
    /** Accessible name of the list of lines. */
    linesLabel: "Items in your cart",
  },

  empty: {
    headline: "Your cart is empty",
    line: "Six scents, each in a 15 g twist-up stick. Start with the one that fits your day.",
    cta: { label: "Shop the range", href: "/collections/all" },
    secondary: { label: "Try the Discovery Set", href: "/products/discovery-set" },
  },

  /** Two indicators: euros to free shipping, then sticks to the free pouch. */
  progress: {
    label: "Your progress",
    shipping: {
      label: "Free shipping",
      remaining: (amount: string) => `${amount} away from free shipping`,
      unlocked: "Free shipping on this order",
      /** Gift cards only: nothing ships. */
      notNeeded: "Delivered by email. No shipping needed.",
      meterLabel: "Progress to free shipping",
      /** Sentence form used in the drawer, e.g. "You are €12.05 away from free shipping". */
      away: (amount: string) => `You are ${amount} away from free shipping`,
      unlockedShort: "Free shipping unlocked",
      /** aria-valuetext of the meter, e.g. "€37.95 of €50". */
      valueText: (current: string, target: string) => `${current} of ${target}`,
    },
    pouch: {
      label: "Free Travel Pouch",
      remaining: (count: number) =>
        count === 1
          ? "Add 1 more stick for a free Travel Pouch"
          : `Add ${count} more sticks for a free Travel Pouch`,
      unlocked: "Free Travel Pouch added (one per order)",
      /** e.g. "2 of 3 sticks". */
      step: (count: number, target: number) => `${Math.min(count, target)} of ${sticks(target)}`,
      meterLabel: "Progress to a free Travel Pouch",
      /** Drawer sentence; the one-per-order condition (D11) follows as its own line (perOrder). */
      away: (count: number) =>
        count === 1
          ? "Add 1 more stick for a free Travel Pouch"
          : `Add ${count} more sticks for a free Travel Pouch`,
      /** Muted second line under `away` (D11). */
      perOrder: "One per order",
      unlockedShort: "Free Travel Pouch unlocked (one per order)",
    },
    /** One plain line once both goals are met (the block collapses). */
    bothUnlocked: "Free shipping and a free Travel Pouch. All set.",
  },

  line: {
    /** A set of sticks chosen on the product page, e.g. "Set of 3". */
    set: (count: number) => (count === 1 ? "1 stick" : `Set of ${count}`),
    scents: (names: string) => names,
    /** A set with its scents, e.g. "Set of 3: North Swell and Dune Fig". */
    setWithScents: (set: string, scents: string) => `${set}: ${scents}`,
    /** One scent in a set, counted when it appears more than once, e.g. "2 × North Swell". */
    scentCount: (name: string, count: number) => (count > 1 ? `${count} × ${name}` : name),
    plan: {
      oneTime: "One-time purchase",
      /** Short label on cart lines. */
      oneTimeShort: "One-time",
      subscription: (count: number) => `Subscribe & save, every ${months(count)}`,
      deliveredAndBilled: (count: number) => `Delivered and billed every ${months(count)}`,
    },
    discoverySet: "Six 3 g mini sticks",
    giftCard: (amount: string) => `E-gift card, ${amount}`,
    giftCardNote: "Delivered by email",
    /** Shown when an existing pouch line became the free pouch. */
    pouchFreeNote: "One pouch free (one per order)",
    /** Shown when grouping makes a stick line cheaper than its sticks at the single price. Text, never a struck-through price. */
    bundlePrice: "Bundle price",
    scentsLabel: "Scents",
    remove: "Remove",
    removeItem: (name: string) => `Remove ${name}`,
    quantity: {
      label: (name: string) => `Quantity of ${name}`,
      decrease: (name: string) => `Decrease quantity of ${name}`,
      increase: (name: string) => `Increase quantity of ${name}`,
    },
    free: "Free",
  },

  /** Gift line shown when the order qualifies for the pouch and none is in the cart. */
  giftLine: {
    title: "Travel Pouch",
    note: `Free with ${facts.freePouchMinSticks} or more sticks (one per order)`,
    price: "Free",
    label: "Free Travel Pouch (one per order)",
    /** Short note under the gift line. */
    noteShort: "One per order",
    gift: "Gift",
  },

  upsell: {
    heading: "Add to your order",
    add: "Add",
    addItem: (name: string) => `Add ${name} to cart`,
    /** Shown when one stick is missing to complete the next set of three. */
    plusOneStick: {
      title: "+1 stick",
      line: (price: string) => `Complete a set of three for ${price} more.`,
      lineWithPouch: (price: string) =>
        `Complete a set of three for ${price} more. The Travel Pouch comes free.`,
      chooseScent: "Choose a scent",
      /** Compact card price: the extra cost, e.g. "+€15.00". */
      extra: (price: string) => `+${price}`,
      note: "Completes a set of three.",
      notePouch: "Completes a set of three. Unlocks the free Travel Pouch.",
      /** A Travel Pouch is already in the cart: the extra stick makes it free, and the card price is the net change. */
      notePouchInCart: "Completes a set of three. Your Travel Pouch becomes free.",
      addItem: (name: string) => `Add 1 ${name} stick to cart`,
    },
    pouch: (price: string) => `Travel Pouch, ${price}`,
    discoverySet: (price: string) => `Discovery Set, ${price}`,
  },

  summary: {
    subtotal: "Subtotal",
    youSave: "You save",
    bundleSavings: "Bundle savings",
    subscriptionSavings: "Subscribe & save",
    pouchSavings: "Free Travel Pouch",
    discount: (code: string) => `Code ${code}`,
    /**
     * Note under Subtotal when sticks from several lines (or a line with a
     * quantity above one) are priced as sets: the lines show their own tile
     * prices, the subtotal the grouped price (D13, D34), e.g. "Sticks grouped into sets: −€14.90".
     */
    groupedSets: (amount: string) => `Sticks grouped into sets: −${amount}`,
    /** Short labels for the line under "You save", e.g. "Sets €14.90 · Travel Pouch €9.95". */
    savingsParts: {
      bundles: "Sets",
      subscription: "Subscription",
      pouch: "Travel Pouch",
      code: "Code",
    },
    /** One part of that line, e.g. "Sets €14.90". */
    savingsPart: (label: string, amount: string) => `${label} ${amount}`,
    shipping: "Shipping",
    shippingAtCheckout: "Calculated at checkout",
    shippingFree: "Free",
    shippingTo: (country: string) => `Shipping to ${country}`,
    noShipping: "No shipping",
    /** Gift cards only. */
    digitalDelivery: "Digital delivery",
    /** A negative amount, e.g. "−€13.49" (U+2212 minus sign). */
    minus: (amount: string) => `−${amount}`,
    total: "Total",
    taxesIncluded: "Taxes included.",
  },

  checkoutButton: {
    label: "Checkout",
    loading: "Opening checkout",
    error: "The checkout did not open. Try again.",
  },

  paymentMethodsLabel: "We accept",

  discount: {
    label: "Discount code",
    placeholder: "Enter code",
    apply: "Apply",
    applying: "Applying",
    remove: "Remove code",
    removeShort: "Remove",
    removeCode: (code: string) => `Remove code ${code}`,
    applied: (code: string, label: string) => `${code} applied: ${label}`,
    rules: "One code per order. Codes do not apply to gift cards.",
    empty: "Enter a code first.",
    errors: {
      unknown: "We do not recognise that code.",
      inactive: "That code is not active.",
      expired: "That code has expired.",
      "not-started": "That code is not valid yet.",
      "nothing-eligible": "Codes do not apply to gift cards. Add a stick or set to use it.",
    } satisfies Record<DiscountError, string>,
  },

  /** Demo checkout page (/checkout). The notice text is fixed by the brief. */
  checkout: {
    title: "Checkout",
    demoNotice: "Demo checkout: no payment is taken",
    intro: "This is a demo. You can walk through the order, but nothing is charged and nothing ships.",
    orderSummary: "Order summary",
    editCart: "Edit cart",
    emptyCart: {
      headline: "Nothing to check out",
      line: "Your cart is empty.",
      cta: { label: "Shop the range", href: "/collections/all" },
    },
    contact: {
      heading: "Contact",
      email: "Email",
      emailPlaceholder: "you@example.com",
    },
    shippingAddress: {
      heading: "Shipping address",
      firstName: "First name",
      lastName: "Last name",
      address: "Street and house number",
      postalCode: "Postcode",
      city: "City",
      country: "Country",
      giftCardsOnly: "Gift cards only: no shipping address needed.",
    },
    required: (field: string) => `Enter your ${field.toLowerCase()}.`,
    invalidEmail: "Enter a valid email address.",
    placeOrder: "Place demo order",
    placing: "Placing order",
    result: {
      heading: "Demo order placed",
      body: "Nothing was charged and nothing will ship. This checkout is a demo.",
      backToShop: { label: "Back to the shop", href: "/collections/all" },
    },
  },
};

export type CartCopy = typeof cartCopy;
