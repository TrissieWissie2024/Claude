import type { DiscoveryScent } from "@/components/media/DiscoverySetRender";
import { getSticks } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

import { productGridClassName, wideGridItemClassName } from "./gridClasses";
import { ProductCard } from "./ProductCard";

/**
 * Responsive grid of product cards: 2 columns on phones, 3 from md, 4 from
 * xl. Server-compatible (no hooks); pass the products already sorted and
 * filtered.
 *
 * `wideSlug` shows one product as a wide card: the full row below xl and two
 * columns from xl, with media exactly as high as its neighbours'. With six
 * sticks plus the Discovery Set (the homepage), every row is then complete
 * at 2, 3 and 4 columns, whether the wide card comes first or last. The
 * column gap lives in --card-gap and the span in --card-span, which the wide
 * card reads to size its media.
 */

export interface ProductGridProps {
  products: readonly Product[];
  /** Slug of the product shown as a wide card. Use it only where it completes the rows. */
  wideSlug?: string;
  /** Number of leading cards whose supplied photos are preloaded. Default 0. */
  priorityCount?: number;
  /** Heading level of the card names. Default 3. */
  headingLevel?: 2 | 3;
  /** Ring colours for the Discovery Set render. Default: the sticks in `products` when all six are there. */
  discoveryScents?: readonly DiscoveryScent[];
  /** Accessible name of the list. */
  label?: string;
  className?: string;
}

export function ProductGrid({
  products,
  wideSlug,
  priorityCount = 0,
  headingLevel = 3,
  discoveryScents,
  label,
  className,
}: ProductGridProps) {
  const sticks = getSticks(products);
  const scents = discoveryScents ?? (sticks.length >= 6 ? sticks : undefined);

  return (
    // role="list" keeps list semantics in Safari, which drops them for list-style: none.
    <ul
      role="list"
      aria-label={label}
      className={cn(productGridClassName, className)}
    >
      {products.map((product, index) => {
        const wide = product.slug === wideSlug;
        return (
          <li key={product.slug} className={cn(wide && wideGridItemClassName)}>
            <ProductCard
              product={product}
              layout={wide ? "wide" : "default"}
              priority={index < priorityCount}
              headingLevel={headingLevel}
              discoveryScents={scents}
            />
          </li>
        );
      })}
    </ul>
  );
}
