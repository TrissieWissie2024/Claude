import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { SortableProductGrid } from "@/components/product/SortableProductGrid";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { home } from "@/content/home";
import { getSticks, SORT_KEYS, sortProducts, type SortKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { commerce } from "@/lib/commerce";
import type { Product } from "@/lib/types";

/**
 * Homepage section 5 (brief §6.5, docs/PLAN.md §4): label, heading and intro,
 * a sort select (right of the heading from md, under it on phones), then the
 * six scents and the Discovery Set. The Discovery Set is the wide card, so
 * every row is complete at 2, 3 and 4 columns in every sort order.
 *
 * A server component: every card (renders, notes, price) is rendered here,
 * once, and the order for each sort key is precomputed. Only the sort state
 * is client-side (SortableProductGrid, which reorders the cards it is given),
 * plus QuickAdd inside each card. So the card, media and content modules stay
 * out of the client bundle.
 */

/** Slug of the product that closes the grid as a wide card. */
const WIDE_SLUG = "discovery-set";

/** The homepage selection: every scent stick plus the Discovery Set, in catalog order. */
function getHomeGridProducts(products: readonly Product[]): Product[] {
  return products.filter((product) => product.kind === "stick" || product.slug === WIDE_SLUG);
}

export interface ProductGridSectionProps {
  /** Products to show. Default: the sticks and the Discovery Set from the catalog. */
  products?: readonly Product[];
  /** The catalog (for the Discovery Set render's six ring colours); fetched from `commerce` when left out. */
  catalog?: readonly Product[];
  className?: string;
}

export async function ProductGridSection({ products, catalog, className }: ProductGridSectionProps) {
  const all = catalog ?? (await commerce.getProducts());
  const list = products ?? getHomeGridProducts(all);
  const discoveryScents = getSticks(all);
  const copy = home.productGrid;
  const headingId = `${copy.id}-heading`;

  const cards: Record<string, ReactNode> = {};
  for (const product of list) {
    cards[product.slug] = (
      <ProductCard
        product={product}
        layout={product.slug === WIDE_SLUG ? "wide" : "default"}
        discoveryScents={discoveryScents}
      />
    );
  }
  const orders = Object.fromEntries(
    SORT_KEYS.map((key) => [key, sortProducts(list, key).map((product) => product.slug)]),
  ) as Record<SortKey, string[]>;

  return (
    <section id={copy.id} aria-labelledby={headingId} className={cn("py-20 md:py-28 lg:py-32", className)}>
      <Container>
        <SortableProductGrid
          headingId={headingId}
          eyebrow={copy.label}
          title={copy.heading}
          intro={copy.intro}
          cards={cards}
          orders={orders}
          defaultSort={copy.sort.defaultValue}
          wideSlug={WIDE_SLUG}
          label={copy.heading}
          gridClassName="mt-10 md:mt-14"
        />

        <div className="mt-14 flex justify-center md:mt-20">
          <Button
            href={copy.viewAll.href}
            variant="outline"
            iconEnd={<ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />}
          >
            {copy.viewAll.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
