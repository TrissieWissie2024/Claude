import Link from "next/link";
import type { ReactNode } from "react";

import { Accordion, type AccordionItem } from "@/components/ui/Accordion";
import { pdp } from "@/content/pdp";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { Product, StickProduct } from "@/lib/types";

/**
 * Accordions of the product page (brief §6, docs/PLAN.md §9), with the Radix
 * Accordion from components/ui (one open at a time, all closed at first):
 *
 * - Scent sticks: Details (the specifications from content/site.ts plus the
 *   ring colour), How to use, Ingredients (the INCI list is a placeholder,
 *   marked "To follow") and Shipping & returns (rates, cut-off and transit
 *   from content/shipping.ts, the 14-day right of withdrawal as a plain legal
 *   right with the exception for sealed sticks (D28), the 30-day guarantee as
 *   something separate, and a link to /shipping-returns).
 * - Discovery Set: the same four, with its own details.
 * - Travel Pouch: Details and Shipping & returns.
 * - E-gift card: How it works, Validity (term marked "To follow") and Delivery.
 *
 * Server-compatible: the content is rendered here and handed to the client
 * Accordion as nodes. Headings are h3 under a visually hidden h2.
 */

export interface ProductAccordionsProps {
  product: Product;
  className?: string;
}

export function ProductAccordions({ product, className }: ProductAccordionsProps) {
  const headingId = `product-info-${product.slug}`;
  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="sr-only">
        {pdp.sections.details}
      </h2>
      <Accordion items={getItems(product)} headingLevel={3} />
    </section>
  );
}

function getItems(product: Product): AccordionItem[] {
  switch (product.kind) {
    case "stick":
      return [
        { id: "details", title: pdp.accordions.details.title, content: <StickDetails stick={product} /> },
        { id: "how-to-use", title: pdp.accordions.howToUse.title, content: <HowToUse /> },
        { id: "ingredients", title: pdp.accordions.ingredients.title, content: <Ingredients /> },
        { id: "shipping-returns", title: pdp.accordions.shippingReturns.title, content: <ShippingReturns /> },
      ];
    case "discovery-set":
      return [
        {
          id: "details",
          title: pdp.accordions.details.title,
          content: <PlainList items={pdp.accordionsFor.discoverySet.details} />,
        },
        { id: "how-to-use", title: pdp.accordions.howToUse.title, content: <HowToUse /> },
        { id: "ingredients", title: pdp.accordions.ingredients.title, content: <Ingredients /> },
        { id: "shipping-returns", title: pdp.accordions.shippingReturns.title, content: <ShippingReturns /> },
      ];
    case "pouch":
      return [
        {
          id: "details",
          title: pdp.accordions.details.title,
          content: <PlainList items={pdp.accordionsFor.pouch.details} />,
        },
        { id: "shipping-returns", title: pdp.accordions.shippingReturns.title, content: <ShippingReturns /> },
      ];
    case "gift-card": {
      const copy = pdp.accordionsFor.giftCard;
      return [
        { id: "how-it-works", title: copy.howItWorks.title, content: <GiftCardHowItWorks /> },
        { id: "validity", title: copy.validity.title, content: <GiftCardValidity /> },
        { id: "delivery", title: copy.delivery.title, content: <GiftCardDelivery /> },
      ];
    }
  }
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

const textLink = "text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink";

/** A list with a short hairline marker per item. */
function PlainList({ items, className }: { items: readonly ReactNode[]; className?: string }) {
  return (
    <ul role="list" className={cn("flex flex-col gap-2", className)}>
      {items.map((item, index) => (
        <li key={index} className="relative pl-5">
          <span aria-hidden="true" className="absolute top-[0.8em] left-0 h-px w-2.5 bg-ink-soft/60" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ToFollow({ children }: { children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <span className="label-caps inline-flex h-5 shrink-0 items-center rounded-full bg-sand px-2 text-[0.6875rem] leading-none tracking-[0.12em] text-ink">
        {pdp.toFollow}
      </span>
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Sticks and Discovery Set                                            */
/* ------------------------------------------------------------------ */

function StickDetails({ stick }: { stick: StickProduct }) {
  const ringName = pdp.ringColour.names[stick.slug];
  return (
    <dl className="flex flex-col divide-y divide-line">
      {site.specs.map((spec) => (
        <div key={spec.id} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-4 py-2.5 first:pt-0 md:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
          <dt className="font-medium text-ink">{spec.label}</dt>
          <dd>{spec.text}</dd>
        </div>
      ))}
      {ringName ? (
        <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-4 py-2.5 last:pb-0 md:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
          <dt className="font-medium text-ink">{pdp.ringColour.label}</dt>
          <dd className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-3 shrink-0 rounded-full ring-1 ring-ink-soft/60"
              style={{ backgroundColor: stick.ringColor }}
            />
            {ringName}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function HowToUse() {
  const copy = pdp.accordions.howToUse;
  return (
    <div className="flex flex-col gap-4">
      <p className="font-serif text-lg text-ink">{copy.intro}</p>
      <ol role="list" className="flex flex-col gap-2.5">
        {copy.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="tabular flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-ink ring-1 ring-ink/20 ring-inset"
            >
              {index + 1}
            </span>
            <span className="pt-px">{step}</span>
          </li>
        ))}
      </ol>
      <p>{copy.note}</p>
    </div>
  );
}

function Ingredients() {
  const copy = pdp.accordions.ingredients;
  return (
    <div className="flex flex-col gap-3">
      <p>{copy.base}</p>
      {copy.isPlaceholder ? <ToFollow>{copy.inciPlaceholder}</ToFollow> : <p>{copy.inciPlaceholder}</p>}
      <p>{copy.note}</p>
    </div>
  );
}

function ShippingReturns() {
  const copy = pdp.accordions.shippingReturns;
  return (
    <div className="flex flex-col gap-4">
      <PlainList items={copy.items} />
      <p>
        <Link href={copy.link.href} className={textLink}>
          {copy.link.label}
        </Link>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* E-gift card                                                         */
/* ------------------------------------------------------------------ */

function GiftCardHowItWorks() {
  const copy = pdp.accordionsFor.giftCard.howItWorks;
  return (
    <div className="flex flex-col gap-4">
      <ol role="list" className="flex flex-col gap-2.5">
        {copy.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="tabular flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-ink ring-1 ring-ink/20 ring-inset"
            >
              {index + 1}
            </span>
            <span className="pt-px">{step}</span>
          </li>
        ))}
      </ol>
      <p>{copy.note}</p>
    </div>
  );
}

function GiftCardValidity() {
  const copy = pdp.accordionsFor.giftCard.validity;
  return (
    <div className="flex flex-col gap-3">
      {copy.isPlaceholder ? <ToFollow>{copy.term}</ToFollow> : <p>{copy.term}</p>}
      <PlainList items={copy.items} />
    </div>
  );
}

function GiftCardDelivery() {
  const copy = pdp.accordionsFor.giftCard.delivery;
  return (
    <div className="flex flex-col gap-3">
      <p>{copy.text}</p>
      <p>
        {copy.terms.before}
        <Link href={copy.terms.href} className={textLink}>
          {copy.terms.label}
        </Link>
        {copy.terms.after}
      </p>
    </div>
  );
}
