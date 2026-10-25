"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { CartThumb, type CartThumbContent } from "@/components/cart/CartLine";
import { useCart } from "@/components/cart/CartProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { Button } from "@/components/ui/Button";
import { cartCopy } from "@/content/cart";
import { offers } from "@/content/offers";
import { formatMoney } from "@/lib/money";
import { stickGroupTotal } from "@/lib/pricing";
import type { CartLine, PricingSummary, PurchasePlan, PurchaseType, StickProduct, SubscriptionInterval } from "@/lib/types";

/**
 * Compact upsell row in the cart drawer (docs/PLAN.md §10), at most three cards:
 * - "+1 stick" when a purchase type holds 3n + 2 sticks: one more completes a
 *   set of three. The extra cost is the difference in group price
 *   (lib/pricing stickGroupTotal), e.g. 2 -> 3 one-time sticks costs €15.00.
 *   The scent defaults to the one most present in the cart.
 * - Travel Pouch, only while the order does not qualify for the free one and
 *   no pouch is in the cart.
 * - Discovery Set, when it is not in the cart.
 */

/* ------------------------------------------------------------------ */
/* +1 stick offer                                                      */
/* ------------------------------------------------------------------ */

export interface PlusOneStickOffer {
  plan: PurchasePlan;
  /** What one more stick of this plan costs on top of the current group price, in cents. */
  extra: number;
  /** True when the extra stick also unlocks the free Travel Pouch. */
  unlocksPouch: boolean;
  /** Default scent slug: the one most present in the cart. */
  scent: string;
}

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
  return {
    plan: type === "subscription" ? { type: "subscription", intervalMonths: subscriptionInterval(lines) } : { type: "one-time" },
    extra: stickGroupTotal(group.stickCount + 1, type) - stickGroupTotal(group.stickCount, type),
    unlocksPouch: !pricing.freePouch.eligible && pricing.freePouch.sticksNeeded === 1,
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
  children?: ReactNode;
}

function UpsellCard({ thumb, title, note, price, addLabel, onAdd, children }: UpsellCardProps) {
  return (
    <li className="flex max-w-[12.5rem] min-w-[10.5rem] flex-1 basis-0 snap-start flex-col overflow-hidden rounded-card bg-white/60 ring-1 ring-inset ring-line">
      <CartThumb content={thumb} size="tile" />
      <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
        <h4 className="font-sans text-[13px] leading-snug font-semibold tracking-normal text-ink">{title}</h4>
        <p className="mt-0.5 text-xs leading-snug text-ink-soft">{note}</p>
        {children}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="tabular text-[13px] leading-none font-semibold whitespace-nowrap text-ink">{price}</span>
          <Button variant="outline" size="sm" aria-label={addLabel} onClick={onAdd} className="h-8 px-3.5">
            {cartCopy.upsell.add}
          </Button>
        </div>
      </div>
    </li>
  );
}

export interface CartUpsellProps {
  className?: string;
}

export function CartUpsell({ className }: CartUpsellProps) {
  const { lines, pricing, addLine } = useCart();
  const { sticks, findProduct, findStick } = useCatalog();
  const headingId = useId();
  const selectId = useId();
  const [chosenScent, setChosenScent] = useState<string | null>(null);
  const copy = cartCopy.upsell;

  const plusOne = getPlusOneStickOffer(lines, pricing, sticks);
  const scent = (chosenScent ? findStick(chosenScent) : null) ?? (plusOne ? findStick(plusOne.scent) : null);

  const pouch = findProduct(offers.freePouch.productSlug);
  const discovery = findProduct("discovery-set");
  const showPouch =
    pouch !== null && !pricing.freePouch.eligible && !lines.some((line) => line.kind === "pouch");
  const showDiscovery = discovery !== null && !lines.some((line) => line.kind === "discovery-set");

  if (!(plusOne && scent) && !showPouch && !showDiscovery) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h3 id={headingId} className="label-caps text-ink-soft">
        {copy.heading}
      </h3>
      <ul className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:-mx-6 md:scroll-px-6 md:px-6">
        {plusOne && scent ? (
          <UpsellCard
            thumb={{ kind: "sticks", ringColors: [scent.ringColor] }}
            title={copy.plusOneStick.title}
            price={copy.plusOneStick.extra(formatMoney(plusOne.extra))}
            note={plusOne.unlocksPouch ? copy.plusOneStick.notePouch : copy.plusOneStick.note}
            addLabel={copy.plusOneStick.addItem(scent.name)}
            onAdd={() => addLine({ kind: "stick", scents: [scent.slug], plan: plusOne.plan, quantity: 1 })}
          >
            <label htmlFor={selectId} className="sr-only">
              {copy.plusOneStick.chooseScent}
            </label>
            <span className="relative mt-2 block">
              <select
                id={selectId}
                value={scent.slug}
                onChange={(event) => setChosenScent(event.target.value)}
                className="h-8 w-full cursor-pointer appearance-none rounded-full bg-fog pr-8 pl-3 text-xs font-medium text-ink ring-1 ring-inset ring-line"
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
            thumb={{ kind: "pouch" }}
            title={pouch.name}
            price={formatMoney(offers.prices.travelPouch)}
            note={pouch.tagline}
            addLabel={copy.addItem(pouch.name)}
            onAdd={() => addLine({ kind: "pouch", slug: "travel-pouch", quantity: 1 })}
          />
        ) : null}

        {showDiscovery && discovery ? (
          <UpsellCard
            thumb={{ kind: "discovery-set" }}
            title={discovery.name}
            price={formatMoney(offers.prices.discoverySet)}
            note={cartCopy.line.discoverySet}
            addLabel={copy.addItem(discovery.name)}
            onAdd={() => addLine({ kind: "discovery-set", slug: "discovery-set", quantity: 1 })}
          />
        ) : null}
      </ul>
    </section>
  );
}
