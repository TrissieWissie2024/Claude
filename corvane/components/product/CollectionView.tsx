"use client";

import { Check } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { collection } from "@/content/collection";
import { parseFamily, parseSortKey, type SortKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { ScentFamily } from "@/lib/types";

import { productGridClassName } from "./gridClasses";
import { SortSelect } from "./SortSelect";

/**
 * The interactive part of /collections/all (brief §6 "Collectie",
 * docs/PLAN.md §11): family filter chips, the sort select, a result count and
 * the grid of product cards.
 *
 * - State lives in the URL (`?family=fresh&sort=price-asc`), read with
 *   useSearchParams and written with window.history.replaceState, which
 *   Next.js keeps in sync with useSearchParams: the grid updates at once,
 *   with no server round trip and no scroll jump.
 *   Defaults ("all", "featured") are left out of the URL. Unknown values fall
 *   back to the defaults (parseFamily, parseSortKey).
 * - A family shows only the sticks of that family (filterByFamily semantics:
 *   the Discovery Set, pouch and gift card have no family). Each family is one
 *   scent at launch, so a link card to the Discovery Set ("Not sure yet?",
 *   `suggestion`) follows the cards; it is not a product card and not counted.
 * - The cards are rendered on the server and arrive as `cards` (one node per
 *   slug), with the slug order per sort key precomputed in `orders`. Sorting
 *   reorders the keyed <li>s, so the DOM and Tab order follow the visible
 *   order and each card keeps its state.
 * - Chips are toggle buttons (aria-pressed); the pressed one is an ink pill
 *   with a check, not only a colour change. Pressing the pressed family again
 *   shows all. The count is a polite live region. On phones the chips wrap
 *   (no hidden sideways scroll), so every family is visible.
 *
 * useSearchParams needs a <Suspense> boundary (the build fails otherwise).
 * The page renders <CollectionViewFallback> (same layout, unfiltered,
 * "featured") as its fallback, so the static HTML holds the full grid for
 * crawlers and visitors without JavaScript. A deep link with ?family= or
 * ?sort= would first paint that unfiltered state, so an inline script in the
 * page marks the wrapper around the boundary (data-collection-query) before
 * the first paint, and the fallback stays invisible (keeping its space) until
 * the real view replaces it; CollectionView removes the mark once it is on
 * screen. The wrapper has suppressHydrationWarning for that attribute.
 */

/** Set on the wrapper around the Suspense boundary by the page's inline script when the URL has ?family= or ?sort=. */
export const COLLECTION_QUERY_ATTRIBUTE = "data-collection-query";

/**
 * The inline script, the first child of that wrapper: runs during HTML parsing, before the
 * fallback after it is parsed or painted.
 */
export const COLLECTION_QUERY_SCRIPT = `try{var q=new URLSearchParams(location.search),w=document.currentScript&&document.currentScript.parentElement;if(w&&(q.has("family")||q.has("sort")))w.setAttribute("${COLLECTION_QUERY_ATTRIBUTE}","")}catch(e){}`;

export interface CollectionEntry {
  slug: string;
  /** The scent family of a stick; null for the other products. */
  family: ScentFamily | null;
  /** Classes of the grid item, e.g. the column span of a wide card. */
  itemClassName?: string;
}

export interface CollectionData {
  /** Every product of the collection, in catalog order. */
  entries: CollectionEntry[];
  /** A server-rendered card per slug. */
  cards: Record<string, ReactNode>;
  /** Slug order per sort key. */
  orders: Record<SortKey, string[]>;
  /** Families with at least one stick, in filter order. */
  families: ScentFamily[];
  /** Ring colour per family, for the dot on its chip (each family is one scent at launch). */
  familyColors?: Partial<Record<ScentFamily, string>>;
  /** Server-rendered link card shown after the cards while a family is selected (the Discovery Set). */
  suggestion?: ReactNode;
}

export type CollectionViewProps = CollectionData;

export function CollectionView(props: CollectionViewProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const family = parseFamily(searchParams.get("family"));
  const sort = parseSortKey(searchParams.get("sort"));

  // The real view is on screen: the fallback is gone, so the pre-paint mark is no longer needed.
  useEffect(() => {
    document.querySelectorAll(`[${COLLECTION_QUERY_ATTRIBUTE}]`).forEach((node) => node.removeAttribute(COLLECTION_QUERY_ATTRIBUTE));
  }, []);

  const update = (next: { family?: ScentFamily | null; sort?: SortKey }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextFamily = next.family !== undefined ? next.family : family;
    const nextSort = next.sort ?? sort;
    if (nextFamily) params.set("family", nextFamily.toLowerCase());
    else params.delete("family");
    if (nextSort !== "featured") params.set("sort", nextSort);
    else params.delete("sort");
    const query = params.toString();
    // A shallow URL update: Next.js syncs useSearchParams with history.replaceState without a
    // server round trip (router.replace refetches the page payload on every chip, ~300 ms).
    // The scroll position stays where it is.
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  return (
    <CollectionLayout
      {...props}
      family={family}
      sort={sort}
      onFamilyChange={(value) => update({ family: value })}
      onSortChange={(value) => update({ sort: value })}
    />
  );
}

/**
 * The Suspense fallback: the same layout, unfiltered, sorted "featured", so the static HTML is
 * complete. Invisible while its wrapper has data-collection-query (a deep link with a filter or sort).
 */
export function CollectionViewFallback(props: CollectionViewProps) {
  return (
    <div className="[[data-collection-query]_&]:invisible">
      <CollectionLayout {...props} family={null} sort="featured" />
    </div>
  );
}

interface CollectionLayoutProps extends CollectionData {
  family: ScentFamily | null;
  sort: SortKey;
  onFamilyChange?: (family: ScentFamily | null) => void;
  onSortChange?: (sort: SortKey) => void;
}

function CollectionLayout({
  entries,
  cards,
  orders,
  families,
  familyColors,
  suggestion,
  family,
  sort,
  onFamilyChange,
  onSortChange,
}: CollectionLayoutProps) {
  const labelId = useId();
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const order = (orders[sort] ?? orders.featured).filter((slug) => {
    const entry = bySlug.get(slug);
    return entry !== undefined && (family === null || entry.family === family);
  });

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 border-y border-line py-4 md:mt-12 md:py-5 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
        {/* The label sits above the chips below xl, so the seven chips keep one row on a tablet. */}
        <div role="group" aria-labelledby={labelId} className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          <span id={labelId} className="label-caps shrink-0 text-ink-soft">
            {collection.filter.legend}
          </span>
          {/*
            Wraps instead of scrolling sideways, so every family is in view: two rows from 360 px
            whichever chip is pressed (the chips are a little narrower below md for that), three
            below; one row from md.
          */}
          <ul role="list" className="flex flex-wrap gap-2 py-1">
            <li className="shrink-0">
              <FilterChip pressed={family === null} onClick={() => onFamilyChange?.(null)}>
                {collection.filter.all}
              </FilterChip>
            </li>
            {families.map((entry) => (
              <li key={entry} className="shrink-0">
                <FilterChip
                  pressed={family === entry}
                  color={familyColors?.[entry]}
                  label={collection.filter.optionLabel(entry)}
                  onClick={() => onFamilyChange?.(family === entry ? null : entry)}
                >
                  {entry}
                </FilterChip>
              </li>
            ))}
          </ul>
        </div>

        {/* Under about 370 px the sort control wraps below the count, so "Sort by" and "9 products" never break. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 whitespace-nowrap xl:shrink-0 xl:flex-nowrap xl:justify-end xl:gap-8">
          <p aria-live="polite" aria-atomic="true" className="tabular text-sm text-ink-soft">
            {collection.resultCount(order.length)}
          </p>
          <SortSelect
            value={sort}
            onChange={(value) => onSortChange?.(value)}
            label={collection.sort.label}
            options={collection.sort.options}
          />
        </div>
      </div>

      {order.length > 0 ? (
        // role="list" keeps list semantics in Safari, which drops them for list-style: none.
        <ul role="list" aria-label={collection.h1} className={cn(productGridClassName, "mt-10 md:mt-12")}>
          {order.map((slug) => (
            <li key={slug} className={family === null ? bySlug.get(slug)?.itemClassName : undefined}>
              {cards[slug]}
            </li>
          ))}
          {family !== null && suggestion ? <li key="suggestion">{suggestion}</li> : null}
        </ul>
      ) : (
        <div className="mt-10 flex flex-col items-start gap-5 rounded-card bg-sand/60 px-6 py-12 md:mt-12 md:items-center md:py-16 md:text-center">
          <p className="font-serif text-2xl text-ink md:text-3xl">{collection.empty.heading}</p>
          <Button variant="outline" onClick={() => onFamilyChange?.(null)}>
            {collection.empty.reset}
          </Button>
        </div>
      )}
    </>
  );
}

function FilterChip({
  pressed,
  color,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  /** Ring colour dot (decorative). */
  color?: string;
  /** Accessible name when it differs from the visible text; must start with it or contain it (WCAG 2.5.3). */
  label?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        // min-w-11: "All" stays a 44 px target with the narrower padding below md.
        "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-3 text-sm font-medium whitespace-nowrap md:gap-2 md:px-4",
        "motion-safe:transition-[background-color,border-color,color] motion-safe:duration-200",
        pressed
          ? "border-ink bg-ink text-fog"
          : "border-ink/20 bg-transparent text-ink hover:border-ink/60",
      )}
    >
      {pressed ? <Check aria-hidden="true" className="-ml-0.5 size-4" strokeWidth={2} /> : null}
      {color ? (
        <span
          aria-hidden="true"
          className={cn("inline-block size-2 shrink-0 rounded-full ring-1", pressed ? "ring-fog/60" : "ring-ink-soft/60")}
          style={{ backgroundColor: color }}
        />
      ) : null}
      {children}
    </button>
  );
}
