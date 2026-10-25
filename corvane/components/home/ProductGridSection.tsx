"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { useCatalog } from "@/components/catalog/CatalogProvider";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SortSelect } from "@/components/product/SortSelect";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { sortProducts, type SortKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * Homepage section 5 (brief §6.5, docs/PLAN.md §4): label, heading and intro,
 * a sort select (right of the heading from md, under it on phones), then the
 * six scents and the Discovery Set. The Discovery Set is the wide card, so
 * every row is complete at 2, 3 and 4 columns in every sort order.
 *
 * Client component: it owns the sort state. Products come from props (e.g.
 * from the server page) or, by default, from useCatalog().
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
  className?: string;
}

export function ProductGridSection({ products, className }: ProductGridSectionProps) {
  const catalog = useCatalog();
  const [sort, setSort] = useState<SortKey>(home.productGrid.sort.defaultValue);
  const copy = home.productGrid;
  const headingId = `${copy.id}-heading`;

  const list = sortProducts(products ?? getHomeGridProducts(catalog.products), sort);

  return (
    <section id={copy.id} aria-labelledby={headingId} className={cn("py-20 md:py-28 lg:py-32", className)}>
      <Container>
        <SectionHeading
          id={headingId}
          eyebrow={copy.label}
          title={copy.heading}
          intro={copy.intro}
          action={<SortSelect value={sort} onChange={setSort} />}
        />

        <ProductGrid
          products={list}
          wideSlug={WIDE_SLUG}
          discoveryScents={catalog.sticks}
          label={copy.heading}
          className="mt-10 md:mt-14"
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
