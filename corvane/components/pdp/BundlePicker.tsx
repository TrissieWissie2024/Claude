"use client";

import { Check, Plus } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/ui/Badge";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { getBundleTileQuote } from "@/lib/pricing";
import type { BundleSize, PurchasePlan, PurchaseType } from "@/lib/types";

/**
 * Bundle tiles on a stick page (docs/PLAN.md §7 rule 10, §9): a native radio
 * group (fieldset + legend) with one tile per size, priced with
 * getBundleTileQuote(size, plan), so the tiles follow the purchase type
 * (subscription totals 2121 / 3821 / 5096).
 *
 * Each tile: label, total, price per stick ("€19.98 per stick", only for 2
 * and 3: for one stick it would repeat the total), the saving as text when
 * there is one ("Save €14.90"), "Best value" only where
 * isBestValue, and "+ Free Travel Pouch (one per order)" where the tile alone
 * reaches the free pouch. Never a struck-through price (brief §2.4). The
 * saving is always measured against single sticks bought one-time
 * (quote.totalSavings = size x €24.95 - total), so it stays true for both
 * purchase types.
 *
 * Also exports the option tile pieces (optionTileClasses, RadioMark) that the
 * purchase type and gift card pickers share.
 */

/* ------------------------------------------------------------------ */
/* Shared option tile                                                  */
/* ------------------------------------------------------------------ */

/**
 * Classes of a selectable tile (a <label> around a visually hidden radio, or
 * a container around such a label). Unselected: 1 px `line` border.
 * Selected: a 2 px ink border, drawn by ::after over the 1 px border, so the
 * content never moves; pseudo-element borders survive forced colors. Focus:
 * a 2 px ink outline outside the tile (`focus` = "within" outlines the tile
 * whenever a radio inside has keyboard focus; "none" leaves focus to the
 * caller).
 */
export function optionTileClasses(selected: boolean, focus: "within" | "none" = "within"): string {
  return cn(
    "relative rounded-card border bg-white/55 transition-colors duration-150",
    selected
      ? "border-ink bg-white after:pointer-events-none after:absolute after:-inset-px after:rounded-card after:border-2 after:border-ink"
      : "border-line hover:border-ink/40",
    focus === "within" && "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
  );
}

/** Round radio mark: an empty ring, or filled ink with a check (the state never relies on colour alone). */
export function RadioMark({ selected, className }: { selected: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        selected
          ? "bg-ink text-fog forced-colors:border forced-colors:border-current"
          // 55% ink: about 4:1 on the white tile (WCAG 1.4.11).
          : "border-[1.5px] border-ink/55 group-hover:border-ink/80",
        className,
      )}
    >
      {selected ? <Check className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Bundle picker                                                       */
/* ------------------------------------------------------------------ */

export const BUNDLE_SIZES: readonly BundleSize[] = [1, 2, 3];

export interface BundlePickerProps {
  value: BundleSize;
  onChange: (size: BundleSize) => void;
  /** Prices follow the plan (or purchase type). */
  plan: PurchasePlan | PurchaseType;
  className?: string;
}

export function BundlePicker({ value, onChange, plan, className }: BundlePickerProps) {
  const name = useId();
  const copy = pdp.bundle;

  return (
    <fieldset className={className}>
      <legend className="label-caps mb-3 text-ink-soft">{copy.legend}</legend>
      <div className="grid gap-2.5">
        {BUNDLE_SIZES.map((size) => {
          const quote = getBundleTileQuote(size, plan);
          const selected = size === value;
          const showPerStick = quote.perStick !== quote.total;
          return (
            <label
              key={size}
              className={cn(
                "group flex cursor-pointer items-start gap-3.5 px-4 py-3.5 md:px-5 md:py-4",
                optionTileClasses(selected),
              )}
            >
              <input
                type="radio"
                name={name}
                value={size}
                checked={selected}
                onChange={() => onChange(size)}
                className="sr-only"
              />
              <RadioMark selected={selected} className="mt-0.5" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-start justify-between gap-3">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[0.9375rem] leading-6 font-semibold text-ink">{copy.tiles[size]}</span>
                    {quote.isBestValue ? <Badge badge="best-value" tone="neutral" size="sm" /> : null}
                  </span>
                  <span className="tabular text-[1.0625rem] leading-6 font-semibold whitespace-nowrap text-ink">
                    {formatMoney(quote.total)}
                  </span>
                </span>
                {showPerStick || quote.totalSavings > 0 ? (
                  <span className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 text-[0.8125rem] leading-5">
                    {showPerStick ? (
                      <span className="tabular text-ink-soft">{copy.perStick(formatMoney(quote.perStick))}</span>
                    ) : null}
                    {quote.totalSavings > 0 ? (
                      <span className="tabular font-medium text-kelp">{copy.savings(formatMoney(quote.totalSavings))}</span>
                    ) : null}
                  </span>
                ) : null}
                {quote.includesFreePouch ? (
                  <span className="mt-2 flex items-center gap-1.5 text-[0.8125rem] leading-5 font-medium text-ink">
                    <Plus aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
                    {copy.freePouch}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
