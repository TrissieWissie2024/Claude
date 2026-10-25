import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pdp } from "@/content/pdp";
import { findProduct, getSticks } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * Cross-sell on the product page (brief §6, docs/PLAN.md §9): the same
 * ProductCard as the grids, with quick add.
 *
 * - Scent sticks: the Discovery Set and the Travel Pouch (pdp.crossSell.slugs).
 * - The e-gift card ("Or choose for them"): the Discovery Set and the first
 *   stick in featured order, the two things that work as a gift on their own
 *   (the pouch holds sticks, sold separately).
 * - The Discovery Set and the Travel Pouch themselves: two scent sticks (the
 *   first two in featured order) instead, so the page never offers itself.
 *
 * Phones: heading, then two cards side by side. lg+: heading left (4 of 12
 * columns), cards right (7 columns), like the FAQ section under it.
 * Server-compatible.
 */

export interface CrossSellProps {
  product: Product;
  /** The catalog. */
  products: readonly Product[];
  /**
   * Hairline above the section, aligned to the container. "lg": from lg only (on phones the
   * accordions above already end on a hairline).
   */
  divider?: boolean | "lg";
  className?: string;
}

/** The two products to offer next to `product`. */
export function getCrossSellProducts(product: Product, products: readonly Product[]): Product[] {
  const byRank = [...getSticks(products)].sort((a, b) => a.featuredRank - b.featuredRank);
  if (product.kind === "gift-card") {
    const set = findProduct(products, "discovery-set");
    return [...(set ? [set] : []), ...byRank].slice(0, 2);
  }
  const kit = pdp.crossSell.slugs
    .filter((slug) => slug !== product.slug)
    .map((slug) => findProduct(products, slug))
    .filter((entry): entry is Product => entry !== null);
  if (kit.length === pdp.crossSell.slugs.length) return kit;
  return byRank.slice(0, 2);
}

export function CrossSell({ product, products, divider = false, className }: CrossSellProps) {
  const items = getCrossSellProducts(product, products);
  if (items.length === 0) return null;

  const heading =
    product.kind === "stick" ? pdp.crossSell.heading : (pdp.crossSellFor.headings[product.kind] ?? pdp.crossSell.heading);
  const headingId = "cross-sell-heading";
  const sticks = getSticks(products);

  return (
    <section id="cross-sell" aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div
          className={cn(
            "grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:gap-x-8 lg:py-32",
            divider === "lg" ? "lg:border-t lg:border-line" : divider && "border-t border-line",
          )}
        >
          <SectionHeading
            id={headingId}
            eyebrow={pdp.crossSellFor.eyebrow}
            title={heading}
            eyebrowRule="neutral"
            className="lg:col-span-4"
          />
          <ul role="list" className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:gap-x-6 lg:col-span-7 lg:col-start-6">
            {items.map((item) => (
              <li key={item.slug}>
                <ProductCard
                  product={item}
                  discoveryScents={sticks.length >= 6 ? sticks : undefined}
                  sizes="(min-width: 1024px) 330px, 50vw"
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
