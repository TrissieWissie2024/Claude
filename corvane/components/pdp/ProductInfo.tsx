import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { productCard } from "@/content/collection";
import { pdp } from "@/content/pdp";
import { getFromPrice, hasFromPrice, isStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatMoneyShort } from "@/lib/money";
import type { Product, StickProduct } from "@/lib/types";

import { IntensityMeters } from "./IntensityMeters";
import { NotesChips } from "./NotesChips";

/**
 * Title block of the product page (docs/PLAN.md §9): family (or an eyebrow
 * for products without one) in label caps, the product name as the page h1,
 * the tagline, a price line and the short description. The Discovery Set
 * lists the six scents it holds. A stick's notes and intensity meters are
 * ScentProfile, which the page renders under the buy box (D50), so the scent
 * picker and Add to cart follow the description directly.
 *
 * The price line is the single-stick price (offers.stickPricing[1] via
 * getFromPrice), the Discovery Set and pouch prices, or "From €25" for the
 * gift card. The configurator under it shows the live price of the choice.
 * Badges only from `product.badges` ("New" at launch, brief §2.7).
 * Server-compatible.
 */

export interface ProductInfoProps {
  product: Product;
  /** The scent sticks, for the contents of the Discovery Set. */
  sticks?: readonly StickProduct[];
  className?: string;
}

export function ProductInfo({ product, sticks = [], className }: ProductInfoProps) {
  const stick = isStick(product) ? product : null;
  const eyebrow = stick ? pdp.family(stick.family) : pdp.eyebrow[product.kind as keyof typeof pdp.eyebrow];
  const size =
    product.kind === "stick" || product.kind === "discovery-set" ? pdp.priceSize[product.kind] : null;
  const amount = getFromPrice(product);

  return (
    <div className={className}>
      <div className="flex min-h-6 items-center justify-between gap-4">
        <p className="label-caps flex items-center gap-2 text-ink-soft">
          {stick ? (
            <span
              aria-hidden="true"
              className="inline-block size-2 shrink-0 rounded-full ring-1 ring-ink-soft/60"
              style={{ backgroundColor: stick.ringColor }}
            />
          ) : null}
          {eyebrow}
        </p>
        {product.badges.length > 0 ? (
          <p className="flex gap-1.5">
            {product.badges.map((badge) => (
              <Badge key={badge} badge={badge} size="sm" />
            ))}
          </p>
        ) : null}
      </div>

      <h1 className="mt-3 text-[2.5rem] leading-[1.02] tracking-[-0.02em] md:mt-4 lg:text-[3.375rem]">
        {product.name}
      </h1>
      <p className="mt-3 text-lg leading-snug text-ink md:text-xl">{product.tagline}</p>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {hasFromPrice(product) ? (
          <span className="tabular text-xl font-semibold text-ink">{productCard.from(formatMoneyShort(amount))}</span>
        ) : (
          <Price amount={amount} previousPrice={product.previousPrice} size="lg" />
        )}
        {size ? <span className="text-sm text-ink-soft">{size}</span> : null}
      </p>

      <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-ink-soft">{product.description}</p>

      {product.kind === "discovery-set" && sticks.length > 0 ? (
        <SetContents sticks={sticks} className="mt-8 border-t border-line pt-6" />
      ) : null}
    </div>
  );
}

/**
 * A stick's notes (chips per tier) and its two indicative intensity meters,
 * each under a hairline. The page puts this after the trust row and before
 * the accordions (D50). Server-compatible.
 */
export function ScentProfile({ product, className }: { product: StickProduct; className?: string }) {
  return (
    <div className={className}>
      <NotesChips notes={product.notes} className="border-t border-line pt-6" />
      <IntensityMeters intensity={product.intensity} className="mt-7 border-t border-line pt-6" />
    </div>
  );
}

/** The six scents of the Discovery Set as chips with their ring colour. */
function SetContents({ sticks, className }: { sticks: readonly StickProduct[]; className?: string }) {
  return (
    <div className={className}>
      <h2 className="label-caps text-ink-soft">{pdp.discoverySet.contentsLabel}</h2>
      <ul role="list" className="mt-3 flex flex-wrap gap-1.5">
        {sticks.map((stick) => (
          <li
            key={stick.slug}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full bg-white/60 px-3.5 text-sm font-medium text-ink",
              "ring-1 ring-ink/12 ring-inset",
            )}
          >
            <span
              aria-hidden="true"
              className="inline-block size-2 shrink-0 rounded-full ring-1 ring-ink-soft/60"
              style={{ backgroundColor: stick.ringColor }}
            />
            {stick.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
