"use client";

import { useState, type ReactNode } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SortKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";

import { productGridClassName, wideGridItemClassName } from "./gridClasses";
import { SortSelect } from "./SortSelect";

/**
 * The sortable part of a product grid section: the section heading with the
 * sort select as its action, and the grid. A client component only for the
 * sort state; the cards themselves are rendered on the server and arrive as
 * `cards` (one node per slug), with the slug order for every sort key
 * precomputed in `orders` (lib/catalog sortProducts).
 *
 * Changing the sort reorders the keyed <li>s, so the DOM order (and the Tab
 * order) follows the visible order, never CSS `order`, and each card keeps its
 * state (QuickAdd's "Added") when it moves.
 */

export interface SortableProductGridProps {
  /** id of the section heading (for aria-labelledby on the section). */
  headingId: string;
  eyebrow: string;
  title: string;
  intro?: string;
  /** A server-rendered card per slug. */
  cards: Record<string, ReactNode>;
  /** Slug order per sort key. */
  orders: Record<SortKey, string[]>;
  defaultSort: SortKey;
  /** Slug of the product shown as a wide card (see ProductGrid). */
  wideSlug?: string;
  /** Accessible name of the list. */
  label?: string;
  /** Classes of the <ul>, e.g. its top margin. */
  gridClassName?: string;
}

export function SortableProductGrid({
  headingId,
  eyebrow,
  title,
  intro,
  cards,
  orders,
  defaultSort,
  wideSlug,
  label,
  gridClassName,
}: SortableProductGridProps) {
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const order = orders[sort] ?? orders[defaultSort];

  return (
    <>
      <SectionHeading
        id={headingId}
        eyebrow={eyebrow}
        title={title}
        intro={intro}
        action={<SortSelect value={sort} onChange={setSort} />}
      />
      {/* role="list" keeps list semantics in Safari, which drops them for list-style: none. */}
      <ul role="list" aria-label={label} className={cn(productGridClassName, gridClassName)}>
        {order.map((slug) => (
          <li key={slug} className={cn(slug === wideSlug && wideGridItemClassName)}>
            {cards[slug]}
          </li>
        ))}
      </ul>
    </>
  );
}
