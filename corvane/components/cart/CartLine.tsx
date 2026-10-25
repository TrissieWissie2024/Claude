"use client";

import type { ReactNode } from "react";

import { getCartLineName, useCart } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { DiscoverySetRender } from "@/components/media/DiscoverySetRender";
import { GiftCardRender } from "@/components/media/GiftCardRender";
import { PouchRender } from "@/components/media/PouchRender";
import { StickRender } from "@/components/media/StickRender";
import { cartCopy } from "@/content/cart";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyShort } from "@/lib/money";
import { bundleUnitPrice, purchaseTypeOf } from "@/lib/pricing";
import type { CartLine as CartLineData, PricedLine, PurchasePlan, StickProduct } from "@/lib/types";

/**
 * One line in the cart drawer (docs/PLAN.md §10): a small render, the name,
 * the scents with their ring colours (stick sets), the plan, a quantity
 * stepper, a Remove button and the line total from PricingSummary.lines.
 *
 * Honest pricing (brief §2.4): no struck-through prices. A stick line shows
 * its own tile price (PricedLine.standaloneTotal: what the product page
 * quoted, e.g. €59.95 for a set of three), never an allocated share; when
 * sticks from several lines are priced as sets, CartSummary shows that
 * saving as one note under Subtotal (D13, D34). A set line, cheaper than its
 * sticks at the single price, gets a short "Bundle price" note.
 */

/* ------------------------------------------------------------------ */
/* Thumbnail                                                           */
/* ------------------------------------------------------------------ */

export type CartThumbContent =
  | { kind: "sticks"; ringColors: string[] }
  | { kind: "pouch" }
  | { kind: "discovery-set" }
  | { kind: "gift-card"; amount?: string };

export interface CartThumbProps {
  content: CartThumbContent;
  /** md: 56 x 70 (cart lines). sm: 48 x 60. tile: full width, 92 px high, square corners (top of an upsell card). */
  size?: "sm" | "md" | "tile";
  /** Background of the tile. Default "sand". */
  tone?: "sand" | "fog";
  className?: string;
}

const thumbSizes = {
  sm: { box: "h-[60px] w-12 rounded-[10px]", stick: "h-[52px]", set: "h-[44px]", art: "h-full w-full" },
  md: { box: "h-[70px] w-14 rounded-[10px]", stick: "h-[62px]", set: "h-[54px]", art: "h-full w-full" },
  tile: { box: "h-[5.75rem] w-full", stick: "h-[72px]", set: "h-[64px]", art: "h-[84px] w-auto" },
} as const;

/** Decorative product render in a small 4:5 tile; the line name next to it carries the meaning. */
export function CartThumb({ content, size = "md", tone = "sand", className }: CartThumbProps) {
  const { sticks } = useCatalog();
  const s = thumbSizes[size];

  let art: ReactNode;
  switch (content.kind) {
    case "sticks": {
      const colors = content.ringColors.slice(0, 3);
      art =
        colors.length === 1 ? (
          <StickRender ringColor={colors[0]} className={cn(s.stick, "w-auto")} />
        ) : (
          <span className="flex items-end">
            {colors.map((color, index) => (
              <StickRender
                key={`${color}-${index}`}
                ringColor={color}
                className={cn(s.set, "w-auto", index > 0 && "-ml-1", index === 1 && colors.length === 3 && "relative z-10 translate-y-[2px]")}
              />
            ))}
          </span>
        );
      break;
    }
    case "pouch":
      art = <PouchRender decorative className={s.art} />;
      break;
    case "discovery-set":
      art = (
        <DiscoverySetRender
          decorative
          className={s.art}
          scents={sticks.map((stick) => ({ name: stick.name, ringColor: stick.ringColor }))}
        />
      );
      break;
    case "gift-card":
      art = <GiftCardRender decorative amount={content.amount} className="h-auto w-full" />;
      break;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        tone === "sand" ? "bg-sand" : "bg-fog ring-1 ring-inset ring-line",
        s.box,
        className,
      )}
    >
      {art}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Small ring-colour dot with a 1px ink-soft outline (some ring colours are under 3:1 on fog). */
export function ScentDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full ring-1 ring-ink-soft", className)}
      style={{ backgroundColor: color }}
    />
  );
}

interface ScentEntry {
  slug: string;
  name: string;
  color: string;
  count: number;
}

/** Each scent once, in the order chosen, with its count. */
function groupScents(scents: readonly string[], findStick: (slug: string) => StickProduct | null): ScentEntry[] {
  const entries: ScentEntry[] = [];
  for (const slug of scents) {
    const existing = entries.find((entry) => entry.slug === slug);
    if (existing) {
      existing.count += 1;
      continue;
    }
    const stick = findStick(slug);
    entries.push({ slug, name: stick?.name ?? slug, color: stick?.ringColor ?? "#8C9399", count: 1 });
  }
  return entries;
}

export function planLabel(plan: PurchasePlan): string {
  return plan.type === "subscription"
    ? cartCopy.line.plan.subscription(plan.intervalMonths)
    : cartCopy.line.plan.oneTimeShort;
}

function thumbFor(line: CartLineData, findStick: (slug: string) => StickProduct | null): CartThumbContent {
  switch (line.kind) {
    case "stick":
      return { kind: "sticks", ringColors: line.scents.map((slug) => findStick(slug)?.ringColor ?? "#8C9399") };
    case "pouch":
      return { kind: "pouch" };
    case "discovery-set":
      return { kind: "discovery-set" };
    case "gift-card":
      return { kind: "gift-card", amount: formatMoneyShort(line.amount) };
  }
}

/* ------------------------------------------------------------------ */
/* Line                                                                */
/* ------------------------------------------------------------------ */

export interface CartLineProps {
  line: CartLineData;
  /** The line's entry in pricing.lines. Without it the line shows no price. */
  priced?: PricedLine;
  /** Quantity as text instead of the stepper and Remove (e.g. an order summary). */
  readOnly?: boolean;
  /** Replaces the default removal (useCart().removeLine), e.g. to move focus afterwards. */
  onRemove?: (lineId: string) => void;
  className?: string;
}

/**
 * A cart line as an <li>. The name is focusable (tabIndex -1, data-cart-line-focus,
 * data-cart-line-id) so focus can land on it after a removal or an upsell add;
 * it then shows the normal :focus-visible ring.
 */
export function CartLine({ line, priced, readOnly = false, onRemove, className }: CartLineProps) {
  const { products, findStick, findProduct } = useCatalog();
  const { setQuantity, removeLine } = useCart();
  const copy = cartCopy.line;

  const accessibleName = getCartLineName(line, products);
  const scents = line.kind === "stick" ? groupScents(line.scents, findStick) : [];
  const isSet = line.kind === "stick" && line.scents.length > 1;

  let title: string;
  if (line.kind === "stick") {
    title = isSet ? copy.set(line.scents.length) : (scents[0]?.name ?? accessibleName);
  } else {
    title = accessibleName;
  }

  let detail: string | null = null;
  if (line.kind === "stick") detail = planLabel(line.plan);
  else if (line.kind === "discovery-set") detail = copy.discoverySet;
  else if (line.kind === "gift-card") detail = copy.giftCardNote;
  else if (line.kind === "pouch") detail = findProduct(line.slug)?.tagline ?? null;

  // Stick lines show their own tile price; grouping across lines is one note under Subtotal (CartSummary).
  const total = line.kind === "stick" ? priced?.standaloneTotal : priced?.total;

  // "Bundle price": the line's tile costs less than its sticks at the single price for its plan.
  const bundled =
    line.kind === "stick" &&
    priced !== undefined &&
    priced.stickCount > 0 &&
    priced.standaloneTotal < priced.stickCount * bundleUnitPrice(1, purchaseTypeOf(line.plan));

  return (
    <li className={cn("flex gap-4 py-5", className)}>
      <CartThumb content={thumbFor(line, findStick)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              tabIndex={-1}
              data-cart-line-focus=""
              data-cart-line-id={line.id}
              className="flex items-center gap-2 font-sans text-[15px] leading-snug font-semibold tracking-normal text-ink"
            >
              {line.kind === "stick" && !isSet && scents[0] ? <ScentDot color={scents[0].color} /> : null}
              <span className="min-w-0">{title}</span>
            </h3>

            {isSet ? (
              <ul aria-label={copy.scentsLabel} className="mt-1.5 flex flex-col gap-1">
                {scents.map((scent) => (
                  <li key={scent.slug} className="flex items-center gap-1.5 text-[13px] leading-snug text-ink">
                    <ScentDot color={scent.color} />
                    {copy.scentCount(scent.name, scent.count)}
                  </li>
                ))}
              </ul>
            ) : null}

            {detail ? <p className="mt-1 text-[13px] leading-snug text-ink-soft">{detail}</p> : null}
            {priced?.includesFreePouch ? (
              <p className="mt-1 text-[13px] leading-snug font-medium text-kelp">{copy.pouchFreeNote}</p>
            ) : null}
          </div>

          {total !== undefined ? (
            <div className="shrink-0 text-right">
              <p className="tabular text-[15px] leading-snug font-semibold text-ink">
                {total === 0 ? copy.free : formatMoney(total)}
              </p>
              {bundled ? <p className="mt-1 text-xs leading-snug font-medium text-kelp">{copy.bundlePrice}</p> : null}
            </div>
          ) : null}
        </div>

        {readOnly ? (
          <p className="tabular mt-2 text-[13px] text-ink-soft">{`× ${line.quantity}`}</p>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <QuantityStepper
              value={line.quantity}
              itemName={accessibleName}
              onChange={(next) => setQuantity(line.id, next)}
            />
            <button
              type="button"
              aria-label={copy.removeItem(accessibleName)}
              onClick={() => (onRemove ? onRemove(line.id) : removeLine(line.id))}
              className="-mr-1 rounded px-1 py-1 text-[13px] text-ink-soft underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
            >
              {copy.remove}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Free pouch gift line                                                */
/* ------------------------------------------------------------------ */

/**
 * Shown when the order qualifies for the free Travel Pouch and no pouch line
 * is in the cart (pricing.freePouch.eligible && appliedToLineId === null).
 */
export function FreePouchLine({ className }: { className?: string }) {
  const copy = cartCopy.giftLine;
  return (
    <li className={cn("flex gap-4 py-5", className)}>
      <CartThumb content={{ kind: "pouch" }} />
      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-sans text-[15px] leading-snug font-semibold tracking-normal text-ink">
            {copy.title}
            <span className="sr-only">{`, ${copy.label}`}</span>
          </h3>
          <p className="mt-1 text-[13px] leading-snug text-balance text-ink-soft">{copy.note}</p>
        </div>
        <p className="shrink-0 text-[15px] leading-snug font-semibold text-kelp">{copy.price}</p>
      </div>
    </li>
  );
}
