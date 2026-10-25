"use client";

import { ChevronDown } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";

import { CartThumb, type CartThumbContent } from "@/components/cart/CartLine";
import { useCart } from "@/components/cart/CartProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { Button } from "@/components/ui/Button";
import { cartCopy } from "@/content/cart";
import { offers } from "@/content/offers";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { cartLineId, priceCart } from "@/lib/pricing";
import type {
  CartLine,
  NewCartLine,
  PricingSummary,
  PurchasePlan,
  PurchaseType,
  StickProduct,
  SubscriptionInterval,
} from "@/lib/types";

/**
 * Compact upsell row in the cart drawer (docs/PLAN.md §10), at most three cards:
 * - "+1 stick" when a purchase type holds 3n + 2 sticks: one more completes a
 *   set of three. The card price is what the order really goes up by (before
 *   a code): the change in the line totals of priceCart, e.g. 2 -> 3 one-time
 *   sticks is +€15.00, or +€5.05 when a Travel Pouch in the cart becomes free.
 *   The scent defaults to the one most present in the cart.
 * - Travel Pouch, only while the order does not qualify for the free one and
 *   no pouch is in the cart.
 * - Discovery Set, when it is not in the cart.
 *
 * Every card disappears once its item is added, so after "Add" focus moves to
 * the next remaining Add button, or to the added line's heading when no card
 * is left (WCAG 2.4.3). A single card spans the full width as a row.
 */

/* ------------------------------------------------------------------ */
/* +1 stick offer                                                      */
/* ------------------------------------------------------------------ */

export interface PlusOneStickOffer {
  plan: PurchasePlan;
  /**
   * What the order goes up by when one more stick of this plan is added, in
   * cents: the change in the sum of the line totals (before a discount code).
   * Includes a Travel Pouch in the cart becoming free.
   */
  extra: number;
  /** True when the extra stick also unlocks the free Travel Pouch. */
  unlocksPouch: boolean;
  /** True when a Travel Pouch is already in the cart (it becomes the free one when unlocksPouch). */
  pouchInCart: boolean;
  /** Default scent slug: the one most present in the cart. */
  scent: string;
}

/** Line totals do not depend on the clock (only code checks do), so a fixed instant is fine. */
const PRICING_EPOCH = new Date(0);

/** Most common subscription interval among the cart's subscription sticks (ties: the first one in the cart). */
function subscriptionInterval(lines: readonly CartLine[]): SubscriptionInterval {
  const counts = new Map<SubscriptionInterval, number>();
  for (const line of lines) {
    if (line.kind !== "stick" || line.plan.type !== "subscription") continue;
    const interval = line.plan.intervalMonths;
    counts.set(interval, (counts.get(interval) ?? 0) + line.scents.length * line.quantity);
  }
  let best: SubscriptionInterval = offers.subscription.defaultIntervalMonths;
  let bestCount = 0;
  for (const [interval, count] of counts) {
    if (count > bestCount) {
      best = interval;
      bestCount = count;
    }
  }
  return best;
}

/** Scent most present in the cart (sticks counted with quantity); ties go to catalog order. */
export function getMostPresentScent(lines: readonly CartLine[], sticks: readonly StickProduct[]): string | null {
  const counts = new Map<string, number>();
  for (const line of lines) {
    if (line.kind !== "stick") continue;
    for (const slug of line.scents) counts.set(slug, (counts.get(slug) ?? 0) + line.quantity);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const stick of sticks) {
    const count = counts.get(stick.slug) ?? 0;
    if (count > bestCount) {
      best = stick.slug;
      bestCount = count;
    }
  }
  return best ?? sticks[0]?.slug ?? null;
}

/**
 * The "+1 stick" offer, or null. Grouping is per purchase type (D10), so the
 * offer applies to a type with 3n + 2 sticks; one-time goes first.
 */
export function getPlusOneStickOffer(
  lines: readonly CartLine[],
  pricing: PricingSummary,
  sticks: readonly StickProduct[],
): PlusOneStickOffer | null {
  const order: PurchaseType[] = ["one-time", "subscription"];
  const group = order
    .map((type) => pricing.groups.find((candidate) => candidate.purchaseType === type))
    .find((candidate) => candidate !== undefined && candidate.stickCount % 3 === 2);
  if (!group) return null;
  const scent = getMostPresentScent(lines, sticks);
  if (!scent) return null;

  const type = group.purchaseType;
  const plan: PurchasePlan =
    type === "subscription" ? { type: "subscription", intervalMonths: subscriptionInterval(lines) } : { type: "one-time" };

  // Price the cart with and without the extra stick; no code, so both sums are line totals.
  const extraLine: NewCartLine = { kind: "stick", scents: [scent], plan, quantity: 1 };
  const country = pricing.shipping.country;
  const before = priceCart({ lines, country, now: PRICING_EPOCH }).subtotal;
  const after = priceCart({
    lines: [...lines, { ...extraLine, id: cartLineId(extraLine) }],
    country,
    now: PRICING_EPOCH,
  }).subtotal;

  return {
    plan,
    extra: after - before,
    unlocksPouch: !pricing.freePouch.eligible && pricing.freePouch.sticksNeeded === 1,
    pouchInCart: lines.some((line) => line.kind === "pouch"),
    scent,
  };
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

interface UpsellCardProps {
  thumb: CartThumbContent;
  title: string;
  note: string;
  price: string;
  addLabel: string;
  onAdd: () => void;
  /** "tile": compact card in the scrolling row. "row": full width, used when it is the only card. */
  layout?: "tile" | "row";
  children?: ReactNode;
}

function AddButton({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    // The ::before grows the small button to a 44 px tall touch target without moving it.
    <Button
      data-upsell-add=""
      variant="outline"
      size="sm"
      aria-label={label}
      onClick={onAdd}
      className="h-8 shrink-0 px-3.5 before:absolute before:-inset-x-1 before:-inset-y-1.5"
    >
      {cartCopy.upsell.add}
    </Button>
  );
}

function UpsellCard({ thumb, title, note, price, addLabel, onAdd, layout = "tile", children }: UpsellCardProps) {
  const heading = <h4 className="font-sans text-[13px] leading-snug font-semibold tracking-normal text-ink">{title}</h4>;
  const noteText = <p className="mt-0.5 text-xs leading-snug text-ink-soft">{note}</p>;
  const priceText = <span className="tabular text-[13px] leading-none font-semibold whitespace-nowrap text-ink">{price}</span>;

  if (layout === "row") {
    return (
      <li className="flex w-full items-center gap-4 rounded-card bg-white/60 p-3 ring-1 ring-inset ring-line">
        <CartThumb content={thumb} size="md" />
        <div className="min-w-0 flex-1">
          {heading}
          {noteText}
          {children}
          <div className="mt-2">{priceText}</div>
        </div>
        <AddButton label={addLabel} onAdd={onAdd} />
      </li>
    );
  }

  return (
    <li className="flex max-w-[12.5rem] min-w-[10.5rem] flex-1 basis-0 snap-start flex-col overflow-hidden rounded-card bg-white/60 ring-1 ring-inset ring-line">
      <CartThumb content={thumb} size="tile" />
      <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
        {heading}
        {noteText}
        {children}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {priceText}
          <AddButton label={addLabel} onAdd={onAdd} />
        </div>
      </div>
    </li>
  );
}

export interface CartUpsellProps {
  className?: string;
}

/** Focuses the heading of a cart line by its id (data-cart-line-id on the CartLine heading). */
function focusLineHeading(root: ParentNode, lineId: string) {
  const headings = root.querySelectorAll<HTMLElement>("[data-cart-line-focus]");
  for (const heading of headings) {
    if (heading.dataset.cartLineId === lineId) {
      heading.focus();
      return;
    }
  }
}

export function CartUpsell({ className }: CartUpsellProps) {
  const { lines, pricing, addLine } = useCart();
  const { sticks, findProduct, findStick } = useCatalog();
  const headingId = useId();
  const selectId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [chosenScent, setChosenScent] = useState<string | null>(null);
  const copy = cartCopy.upsell;

  // The card of the added item disappears (sometimes another one too, e.g. the pouch once it is free),
  // so move focus to the Add button that took its place, or to the added line when no card is left.
  const handleAdd = (index: number, newLine: NewCartLine) => {
    const root: ParentNode = listRef.current?.closest("[role='dialog']") ?? document;
    addLine(newLine);
    requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLElement>("[data-upsell-add]");
      if (buttons && buttons.length > 0) buttons[Math.min(index, buttons.length - 1)].focus();
      else focusLineHeading(root, cartLineId(newLine));
    });
  };

  const plusOne = getPlusOneStickOffer(lines, pricing, sticks);
  const scent = (chosenScent ? findStick(chosenScent) : null) ?? (plusOne ? findStick(plusOne.scent) : null);

  const pouch = findProduct(offers.freePouch.productSlug);
  const discovery = findProduct("discovery-set");
  const showPouch =
    pouch !== null && !pricing.freePouch.eligible && !lines.some((line) => line.kind === "pouch");
  const showDiscovery = discovery !== null && !lines.some((line) => line.kind === "discovery-set");

  const showPlusOne = plusOne !== null && scent !== null;
  const cardCount = [showPlusOne, showPouch, showDiscovery].filter(Boolean).length;
  if (cardCount === 0) return null;
  const layout = cardCount === 1 ? "row" : "tile";
  // Position of each card among the rendered ones (for focus after Add).
  const pouchIndex = showPlusOne ? 1 : 0;
  const discoveryIndex = pouchIndex + (showPouch ? 1 : 0);

  let plusOneNote: string = copy.plusOneStick.note;
  if (plusOne?.unlocksPouch) plusOneNote = plusOne.pouchInCart ? copy.plusOneStick.notePouchInCart : copy.plusOneStick.notePouch;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h3 id={headingId} className="label-caps text-ink-soft">
        {copy.heading}
      </h3>
      <ul
        ref={listRef}
        className={cn(
          "mt-3",
          layout === "tile" &&
            "no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:-mx-6 md:scroll-px-6 md:px-6",
        )}
      >
        {showPlusOne && plusOne && scent ? (
          <UpsellCard
            layout={layout}
            thumb={{ kind: "sticks", ringColors: [scent.ringColor] }}
            title={copy.plusOneStick.title}
            price={copy.plusOneStick.extra(formatMoney(plusOne.extra))}
            note={plusOneNote}
            addLabel={copy.plusOneStick.addItem(scent.name)}
            onAdd={() => handleAdd(0, { kind: "stick", scents: [scent.slug], plan: plusOne.plan, quantity: 1 })}
          >
            <label htmlFor={selectId} className="sr-only">
              {copy.plusOneStick.chooseScent}
            </label>
            <span className={cn("relative mt-2 block", layout === "row" && "max-w-[12rem]")}>
              <select
                id={selectId}
                value={scent.slug}
                onChange={(event) => setChosenScent(event.target.value)}
                // The ring is a box-shadow, which forced colors drops; an outline takes its place there.
                className="h-8 w-full cursor-pointer appearance-none rounded-full bg-fog pr-8 pl-3 text-xs font-medium text-ink ring-1 ring-inset ring-line forced-colors:outline-1 forced-colors:-outline-offset-1"
              >
                {sticks.map((stick) => (
                  <option key={stick.slug} value={stick.slug}>
                    {stick.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-soft"
                strokeWidth={2}
              />
            </span>
          </UpsellCard>
        ) : null}

        {showPouch && pouch ? (
          <UpsellCard
            layout={layout}
            thumb={{ kind: "pouch" }}
            title={pouch.name}
            price={formatMoney(offers.prices.travelPouch)}
            note={pouch.tagline}
            addLabel={copy.addItem(pouch.name)}
            onAdd={() => handleAdd(pouchIndex, { kind: "pouch", slug: "travel-pouch", quantity: 1 })}
          />
        ) : null}

        {showDiscovery && discovery ? (
          <UpsellCard
            layout={layout}
            thumb={{ kind: "discovery-set" }}
            title={discovery.name}
            price={formatMoney(offers.prices.discoverySet)}
            note={cartCopy.line.discoverySet}
            addLabel={copy.addItem(discovery.name)}
            onAdd={() => handleAdd(discoveryIndex, { kind: "discovery-set", slug: "discovery-set", quantity: 1 })}
          />
        ) : null}
      </ul>
    </section>
  );
}
