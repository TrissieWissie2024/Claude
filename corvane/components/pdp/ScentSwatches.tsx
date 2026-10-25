"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, type MouseEvent } from "react";

import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import { markToneOn } from "@/lib/color";
import type { StickProduct } from "@/lib/types";

/**
 * Scent picker on a stick page (docs/PLAN.md §9): one link per scent to
 * /products/[slug]. They are links, not radios: every scent has its own page
 * (and URL). `scroll={false}` keeps the visitor where they are, and
 * PdpStateProvider (app/products/layout.tsx) keeps the other choices.
 *
 * - Round swatch in the ring colour with a 1 px ink-soft ring (some ring
 *   colours are under 3:1 on fog, D17).
 * - The current scent: aria-current="page", a 2 px ink ring with an offset
 *   around the swatch and a check inside it (ink or fog, whichever contrasts
 *   more with the ring colour), so the state never relies on colour alone and
 *   survives forced colors. The name of the current scent is shown above the
 *   row; from lg every swatch also shows its name underneath (on a phone six
 *   names do not fit in one row).
 * - 44 x 44 px targets. Focus has a different shape from the selection: a
 *   rounded square around the target below lg, the whole swatch-and-name cell
 *   from lg, never a circle like the selected ring.
 * - Focus follows the scent: a swatch that starts the navigation hands the
 *   focus to the current swatch of the new page (Activity keeps the old page
 *   mounted but hidden, so the focus would otherwise drop to <body> and the
 *   next Tab would land in the footer; WCAG 2.4.3).
 * - prefetch: product pages are static, so switching scents is instant in
 *   production (partialPrefetching, docs primer §3).
 */

export interface ScentSwatchesProps {
  /** All scent sticks, in catalog order. */
  sticks: readonly StickProduct[];
  /** Slug of the page's scent. */
  currentSlug: string;
  className?: string;
}

/**
 * Set when a swatch starts a navigation (a plain click or Enter); the swatches
 * of the page that opens read it once. Module scope, because the page that
 * sets it is not the page that reads it.
 */
let pendingFocus: { slug: string; at: number } | null = null;

/** A navigation slower than this no longer moves the focus (the visitor has moved on). */
const PENDING_FOCUS_MS = 10_000;

function isPlainActivation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function ScentSwatches({ sticks, currentSlug, className }: ScentSwatchesProps) {
  const labelId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const current = sticks.find((stick) => stick.slug === currentSlug);

  // Runs when this page mounts, and again when Activity shows it again (back to a scent seen before).
  useEffect(() => {
    const pending = pendingFocus;
    if (!pending || pending.slug !== currentSlug) return;
    pendingFocus = null;
    if (performance.now() - pending.at > PENDING_FOCUS_MS) return;
    listRef.current?.querySelector<HTMLElement>('a[aria-current="page"]')?.focus({ preventScroll: true });
  }, [currentSlug]);

  return (
    <div role="group" aria-labelledby={labelId} className={className}>
      <p className="flex items-baseline gap-2.5">
        <span id={labelId} className="label-caps text-ink-soft">
          {pdp.scentPicker.label}
        </span>
        {current ? (
          <span aria-hidden="true" className="text-[0.9375rem] font-medium text-ink">
            {current.name}
          </span>
        ) : null}
      </p>

      <ul
        ref={listRef}
        className="mt-2 -ml-1.5 flex flex-wrap gap-x-1.5 gap-y-1 lg:mt-3 lg:ml-0 lg:grid lg:grid-cols-6 lg:gap-x-0.5"
      >
        {sticks.map((stick) => {
          const selected = stick.slug === currentSlug;
          return (
            <li key={stick.slug} className="lg:min-w-0">
              <Link
                href={`/products/${stick.slug}`}
                scroll={false}
                prefetch
                aria-current={selected ? "page" : undefined}
                title={stick.name}
                onClick={(event) => {
                  if (!selected && isPlainActivation(event)) {
                    pendingFocus = { slug: stick.slug, at: performance.now() };
                  }
                }}
                className={cn(
                  // Focus: a rounded square (lg: the whole cell), so it never looks like the round selected ring.
                  "group flex flex-col items-center rounded-[12px] no-underline focus-visible:outline-offset-0",
                  "lg:rounded-card lg:pb-1 lg:focus-visible:outline-offset-2",
                )}
              >
                <span className="flex size-11 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full ring-1 ring-inset ring-ink-soft",
                      "motion-safe:transition-[outline-color] motion-safe:duration-200",
                      selected
                        ? "outline-2 outline-offset-2 outline-ink"
                        : "outline-2 outline-offset-2 outline-transparent group-hover:outline-ink/25",
                    )}
                    style={{ backgroundColor: stick.ringColor }}
                  >
                    {selected ? (
                      <Check
                        className={cn("size-3.5", markToneOn(stick.ringColor) === "fog" ? "text-fog" : "text-ink")}
                        strokeWidth={3}
                      />
                    ) : null}
                  </span>
                </span>
                <span
                  className={cn(
                    "sr-only lg:not-sr-only lg:mt-1 lg:block lg:text-center lg:text-xs lg:leading-tight lg:text-balance",
                    // Same weight for every name, so the chosen one never wraps where the others do.
                    selected ? "lg:text-ink" : "lg:text-ink-soft lg:group-hover:text-ink",
                  )}
                >
                  {stick.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
