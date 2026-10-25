import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import {
  COLLECTION_QUERY_SCRIPT,
  CollectionView,
  CollectionViewFallback,
  type CollectionData,
} from "@/components/product/CollectionView";
import { ProductMedia } from "@/components/media/ProductMedia";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { InlineScript } from "@/components/ui/InlineScript";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { collection } from "@/content/collection";
import { site } from "@/content/site";
import {
  findProduct,
  getFamilies,
  getFromPrice,
  getSticks,
  isStick,
  SORT_KEYS,
  sortProducts,
  type SortKey,
} from "@/lib/catalog";
import { commerce } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";
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
    suggestion: <DiscoverySuggestion products={products} />,
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

/**
 * Shown after the cards while a family is selected: each family is one scent
 * at launch, so a lone card gets a link to the Discovery Set next to it. The
 * copy is the mobile menu's feature card (site.header.menuFeature: "Not sure
 * yet?"); name, tagline and price come from the catalog and content/offers.ts.
 * A link, not a product card, so the family still lists only its sticks (D50).
 */
function DiscoverySuggestion({ products }: { products: readonly Product[] }) {
  const feature = site.header.menuFeature;
  const product = findProduct(products, feature.productSlug);
  if (!product) return null;
  const sticks = getSticks(products);
  return (
    <Link
      href={feature.href}
      className="group flex h-full flex-col rounded-card text-ink no-underline focus-visible:outline-offset-4"
    >
      <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-card ring-1 ring-line ring-inset">
        <ProductMedia
          product={product}
          aspect="fill"
          tone="sand"
          decorative
          sizes="(min-width: 1280px) 290px, (min-width: 768px) 33vw, 50vw"
          discoveryScents={sticks.length >= 6 ? sticks : undefined}
        />
      </span>
      <span className="label-caps mt-4 text-ink-soft md:mt-5">{feature.eyebrow}</span>
      <span className="mt-1.5 font-serif text-[1.1875rem] leading-[1.15] decoration-1 underline-offset-4 group-hover:underline md:text-[1.375rem]">
        {product.name}
      </span>
      <span className="mt-1.5 text-sm leading-snug text-ink-soft md:text-[0.9375rem]">{product.tagline}</span>
      <span className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="tabular text-base font-semibold">{formatMoney(getFromPrice(product))}</span>
        <ArrowRight
          aria-hidden="true"
          className="size-[18px] shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5"
          strokeWidth={1.75}
        />
      </span>
    </Link>
  );
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
      <SectionHeading
        level={1}
        eyebrow={collection.eyebrow}
        title={collection.h1}
        intro={keepCompounds(collection.intro)}
        eyebrowRule="neutral"
      />
      {/* Before the first paint, a deep link with ?family= or ?sort= marks this wrapper: the unfiltered fallback stays invisible. */}
      <div suppressHydrationWarning>
        <InlineScript html={COLLECTION_QUERY_SCRIPT} />
        <Suspense fallback={<CollectionViewFallback {...data} />}>
          <CollectionView {...data} />
        </Suspense>
      </div>
    </Container>
  );
}
