"use client";

import { Check } from "lucide-react";
import { useId } from "react";

import { cartCopy } from "@/content/cart";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import { markToneOn } from "@/lib/color";
import type { BundleSize, StickProduct } from "@/lib/types";

import type { ExtraScents } from "./PdpStateProvider";

/**
 * Mix & match for a set of 2 or 3 (docs/PLAN.md §9). Stick 1 is the scent of
 * the page (shown, not chosen here). Sticks 2 and 3 each get a compact native
 * radio group of the six scents: a row of swatches in the ring colour with the
 * scent name as the radio's accessible name, the chosen name next to the slot
 * label, and a 2 px ink ring with an offset plus a check around and inside
 * the chosen swatch (never colour alone). Keyboard focus is a rounded square
 * around the 44 px target, a different shape from the round selected ring.
 * Each slot defaults to the page scent. A summary line names
 * the whole set the way the cart will ("Your set: 2 × North Swell and Dune Fig").
 */

export interface MixAndMatchProps {
  sticks: readonly StickProduct[];
  /** The page scent: stick 1, and the default for sticks 2 and 3. */
  pageSlug: string;
  bundleSize: BundleSize;
  /** From PdpStateProvider; null means "untouched: same as the page scent". */
  extraScents: ExtraScents;
  onChange: (slot: 0 | 1, slug: string) => void;
  className?: string;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "North Swell, Dune Fig, North Swell" -> "2 × North Swell and Dune Fig" (first appearance order). */
export function describeSet(names: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return joinList([...counts].map(([name, count]) => cartCopy.line.scentCount(name, count)));
}

function Swatch({ color, selected, size = "md" }: { color: string; selected: boolean; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-ink-soft",
        size === "md" ? "size-7" : "size-3",
        size === "md" && "outline-2 outline-offset-2",
        size === "md" && (selected ? "outline-ink" : "outline-transparent group-hover:outline-ink/25"),
      )}
      style={{ backgroundColor: color }}
    >
      {size === "md" && selected ? (
        <Check className={cn("size-3", markToneOn(color) === "fog" ? "text-fog" : "text-ink")} strokeWidth={3} />
      ) : null}
    </span>
  );
}

function SlotPicker({
  index,
  sticks,
  value,
  onSelect,
}: {
  /** 2 or 3. */
  index: 2 | 3;
  sticks: readonly StickProduct[];
  value: string;
  onSelect: (slug: string) => void;
}) {
  const name = useId();
  const chosen = sticks.find((stick) => stick.slug === value);

  return (
    <fieldset>
      <legend className="sr-only">{pdp.mixMatch.selectLabel(index)}</legend>
      <p aria-hidden="true" className="flex items-baseline gap-2 text-[0.8125rem] leading-5">
        <span className="font-semibold text-ink">{pdp.mixMatch.slot(index)}</span>
        {chosen ? <span className="text-ink">{chosen.name}</span> : null}
      </p>
      <div className="mt-1 -ml-2 flex flex-wrap gap-x-1">
        {sticks.map((stick) => {
          const selected = stick.slug === value;
          return (
            <label
              key={stick.slug}
              title={stick.name}
              className="group relative flex size-11 cursor-pointer items-center justify-center rounded-[12px] has-focus-visible:outline-2 has-focus-visible:outline-offset-0 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name={name}
                value={stick.slug}
                checked={selected}
                onChange={() => onSelect(stick.slug)}
                className="sr-only"
              />
              <Swatch color={stick.ringColor} selected={selected} />
              <span className="sr-only">{stick.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function MixAndMatch({ sticks, pageSlug, bundleSize, extraScents, onChange, className }: MixAndMatchProps) {
  const headingId = useId();
  if (bundleSize < 2) return null;

  const page = sticks.find((stick) => stick.slug === pageSlug);
  const valid = (slug: string | null) => (slug && sticks.some((stick) => stick.slug === slug) ? slug : pageSlug);
  const slots = ([2, 3] as const).slice(0, bundleSize - 1);
  const setSlugs = [pageSlug, ...slots.map((index) => valid(extraScents[index - 2]))];
  const setNames = setSlugs.map((slug) => sticks.find((stick) => stick.slug === slug)?.name ?? slug);

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn("rounded-card bg-sand/60 px-4 py-4 md:px-5 md:py-5", className)}
    >
      <p id={headingId} className="label-caps text-ink-soft">
        {pdp.mixMatch.legend}
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-5 text-ink-soft">{pdp.mixMatch.intro}</p>

      <div className="mt-4 grid gap-3">
        {page ? (
          <p className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] leading-5">
            <span className="font-semibold text-ink">{pdp.mixMatch.slot(1)}</span>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Swatch color={page.ringColor} selected={false} size="sm" />
              {page.name}
            </span>
            <span className="text-ink-soft">{pdp.mixMatch.pageScent}</span>
          </p>
        ) : null}

        {slots.map((index) => (
          <SlotPicker
            key={index}
            index={index}
            sticks={sticks}
            value={valid(extraScents[index - 2])}
            onSelect={(slug) => onChange(index === 2 ? 0 : 1, slug)}
          />
        ))}
      </div>

      <p className="mt-4 border-t border-ink/10 pt-3 text-[0.8125rem] leading-5 font-medium text-ink">
        {pdp.mixMatch.summary(describeSet(setNames))}
      </p>
    </div>
  );
}
