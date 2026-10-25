"use client";

import Link from "next/link";
import { useId } from "react";

import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import type { StickProduct } from "@/lib/types";

/**
 * Scent picker on a stick page (docs/PLAN.md §9): one link per scent to
 * /products/[slug]. They are links, not radios: every scent has its own page
 * (and URL). `scroll={false}` keeps the visitor where they are, and
 * PdpStateProvider (app/products/layout.tsx) keeps the other choices.
 *
 * - Round swatch in the ring colour with a 1 px ink-soft ring (some ring
 *   colours are under 3:1 on fog, D17).
 * - The current scent: aria-current="true" and a 2 px ink ring with an offset
 *   around the swatch, so the state never relies on colour alone. The name of
 *   the current scent is shown above the row; from lg every swatch also shows
 *   its name underneath (on a phone six names do not fit in one row).
 * - 44 x 44 px targets; focus draws the global 2 px ink outline around the
 *   whole target, outside the selected ring, so the two never look alike.
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

export function ScentSwatches({ sticks, currentSlug, className }: ScentSwatchesProps) {
  const labelId = useId();
  const current = sticks.find((stick) => stick.slug === currentSlug);

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

      <ul className="mt-2 -ml-1.5 flex flex-wrap gap-x-1.5 gap-y-1 lg:mt-3 lg:ml-0 lg:grid lg:grid-cols-6 lg:gap-x-0.5">
        {sticks.map((stick) => {
          const selected = stick.slug === currentSlug;
          return (
            <li key={stick.slug} className="lg:min-w-0">
              <Link
                href={`/products/${stick.slug}`}
                scroll={false}
                prefetch
                aria-current={selected ? "true" : undefined}
                title={stick.name}
                className={cn(
                  "group flex flex-col items-center rounded-full no-underline lg:rounded-card lg:pb-1",
                  "focus-visible:outline-offset-1",
                )}
              >
                <span className="flex size-11 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block size-8 rounded-full ring-1 ring-inset ring-ink-soft",
                      "motion-safe:transition-[outline-color,transform] motion-safe:duration-200",
                      selected
                        ? "outline-2 outline-offset-2 outline-ink"
                        : "outline-2 outline-offset-2 outline-transparent group-hover:outline-ink/25",
                    )}
                    style={{ backgroundColor: stick.ringColor }}
                  />
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
