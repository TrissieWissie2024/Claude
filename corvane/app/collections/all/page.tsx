import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import {
  CollectionView,
  CollectionViewFallback,
  type CollectionData,
} from "@/components/product/CollectionView";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { collection } from "@/content/collection";
import { getFamilies, getSticks, isStick, SORT_KEYS, sortProducts, type SortKey } from "@/lib/catalog";
import { commerce } from "@/lib/commerce";
import type { Product, ScentFamily } from "@/lib/types";

export const metadata: Metadata = {
  title: collection.meta.title,
  description: collection.meta.description,
  alternates: { canonical: "/collections/all" },
};

/**
 * Grid spans that complete every row in every sort order with the launch
 * catalog (six sticks, Discovery Set, Travel Pouch, e-gift card):
 * - 2 columns: the Discovery Set takes the full row (9 cards + 1 = 5 rows).
 * - 3 columns (md): every card is one cell (3 rows).
 * - 4 columns (xl): the Discovery Set, the pouch and the gift card take two
 *   cells each (6 + 6 = 12 cells = 3 rows); in featured, price and newest
 *   order no wide card straddles a row break.
 * The wide cards set --card-span, so their media stays as high as a regular
 * card's (ProductCard layout="wide"). Re-check these if the catalog changes.
 */
const ITEM_CLASSES: Partial<Record<string, string>> = {
  "discovery-set": "col-span-2 [--card-span:2] md:col-span-1 md:[--card-span:1] xl:col-span-2 xl:[--card-span:2]",
  "travel-pouch": "[--card-span:1] xl:col-span-2 xl:[--card-span:2]",
  "e-gift-card": "[--card-span:1] xl:col-span-2 xl:[--card-span:2]",
};

function getCollectionData(products: readonly Product[]): CollectionData {
  const sticks = getSticks(products);
  const discoveryScents = sticks.length >= 6 ? sticks : undefined;

  const cards: Record<string, ReactNode> = {};
  for (const product of products) {
    cards[product.slug] = (
      <ProductCard
        product={product}
        // The page h1 is the grid's title, so card names are h2s.
        headingLevel={2}
        layout={ITEM_CLASSES[product.slug] ? "wide" : "default"}
        discoveryScents={discoveryScents}
      />
    );
  }

  const orders = Object.fromEntries(
    SORT_KEYS.map((key) => [key, sortProducts(products, key).map((product) => product.slug)]),
  ) as Record<SortKey, string[]>;

  const familyColors: Partial<Record<ScentFamily, string>> = {};
  for (const stick of sticks) familyColors[stick.family] ??= stick.ringColor;

  return {
    entries: products.map((product) => ({
      slug: product.slug,
      family: isStick(product) ? product.family : null,
      itemClassName: ITEM_CLASSES[product.slug],
    })),
    cards,
    orders,
    families: getFamilies(products),
    familyColors,
  };
}

/** Keeps "e-gift" in one piece: browsers may break after its hyphen ("e-" / "gift cards" on a phone). */
function keepCompounds(text: string): ReactNode {
  return text.split(/(\be-gift\b)/i).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/**
 * /collections/all (brief §6 "Collectie", docs/PLAN.md §11): every product,
 * with a family filter and sorting (featured, newest, price low to high and
 * high to low) kept in `?family=&sort=`.
 *
 * A static server page: the cards are rendered here, once; only the filter
 * and sort state is client-side (CollectionView). CollectionView reads the
 * URL with useSearchParams, so it sits in <Suspense>; the fallback is the
 * same layout, unfiltered and in featured order, so the static HTML holds the
 * full grid. Server `searchParams` are never read (they would make the route
 * dynamic).
 */
export default async function CollectionPage() {
  const products = await commerce.getProducts();
  const data = getCollectionData(products);

  return (
    <Container className="pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
      <SectionHeading level={1} eyebrow={collection.eyebrow} title={collection.h1} intro={keepCompounds(collection.intro)} />
      <Suspense fallback={<CollectionViewFallback {...data} />}>
        <CollectionView {...data} />
      </Suspense>
    </Container>
  );
}
