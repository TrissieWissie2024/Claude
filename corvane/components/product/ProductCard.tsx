import Link from "next/link";
import type { CSSProperties } from "react";

import type { DiscoveryScent } from "@/components/media/DiscoverySetRender";
import { SLOT_TONES } from "@/components/media/PhotoSlot";
import { ProductMedia } from "@/components/media/ProductMedia";
import { StickRender } from "@/components/media/StickRender";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Stars } from "@/components/ui/Stars";
import { getProductImage } from "@/content/assets";
import { productCard } from "@/content/collection";
import { getCardNotes, getFromPrice, hasFromPrice, isStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatMoneyShort } from "@/lib/money";
import { getRatingSummary } from "@/lib/reviews";
import type { Product, StickProduct } from "@/lib/types";

import { QuickAdd } from "./QuickAdd";

/**
 * Product card for the homepage grid and the collection page (brief §6.5,
 * docs/PLAN.md §11). Server-compatible: no hooks; only QuickAdd is a client
 * island.
 *
 * - Media in a fixed 4:5 box on a sand panel: the supplied packshot photo
 *   (content/assets.ts), otherwise the SVG render. Badges from
 *   `product.badges` only (just "New" at launch, brief §2.7).
 * - Sticks get a label at the bottom of the media: family and the three card
 *   notes (getCardNotes) on a solid fog panel, so the text never sits on a
 *   ring colour or a photo (AA). With the render, the stick stands tall on the
 *   left and the label sits bottom right ("specimen" layout), so the ring at
 *   the base of the stick is never covered; badges sit top right.
 * - Name (serif), one line, price (getFromPrice; "From €25" for gift cards)
 *   and QuickAdd. A card narrower than 14.5rem (two columns on a phone, three on a small tablet) stacks
 *   the price above a full-width QuickAdd, so every card in a row ends the
 *   same way ("From €25" and "Choose amount" do not fit side by side in a
 *   170 px card). The card is a size container for that (container query).
 *   A card narrower than 8rem (only with large text, e.g. a 24 or 32 px
 *   default font size on a phone; at 16 px the narrowest card is 8.4rem, on a
 *   320 px screen) moves the notes label off the media into the details,
 *   where it can wrap, so it is never cut off by the fixed 4:5 box
 *   (WCAG 1.4.4). Only one of the two labels is displayed at a time. For sticks the line is `mood` (when to wear it), because the
 *   label on the media already says what it smells of; the tagline stays on
 *   the product page. Other products show their tagline. Stars only with real
 *   reviews (getRatingSummary is null at launch).
 * - The whole card links to /products/[slug]: the name link has a stretched
 *   ::after over the card (z-1, above the media, so a tap on the image
 *   navigates too); QuickAdd sits above that (relative z-10), so no
 *   interactive element is nested in another. Keyboard focus draws the ring
 *   around the whole card.
 *
 * DOM order is name, media, details (the name is read first); the media is
 * shown first with CSS order.
 *
 * `layout="wide"` spans several grid columns (see ProductGrid): its media is
 * exactly as high as a regular card's, computed from the card's own width
 * (container query units) and the grid's --card-span / --card-gap.
 */

export type ProductCardLayout = "default" | "wide";

export interface ProductCardProps {
  product: Product;
  /** Preload a supplied photo (the first cards above the fold). Renders are inline SVG either way. */
  priority?: boolean;
  /** Heading element of the name. Default 3 (under a section h2); use 2 on a page whose h1 is the grid's title. */
  headingLevel?: 2 | 3;
  /** Default "default" (4:5 media). "wide": spans the columns set by ProductGrid, same media height. */
  layout?: ProductCardLayout;
  /** Ring colours for the Discovery Set render (the six sticks from the catalog). */
  discoveryScents?: readonly DiscoveryScent[];
  /** next/image sizes for a supplied photo. */
  sizes?: string;
  className?: string;
}

const DEFAULT_SIZES = "(min-width: 1280px) 290px, (min-width: 768px) 33vw, 50vw";
const WIDE_SIZES = "(min-width: 1280px) 600px, 100vw";

/**
 * Height of a wide card's media: one column's width x 5/4. 100cqw is the
 * card's width (the card is a size container) = span x column + (span - 1) x gap.
 */
const WIDE_MEDIA_STYLE: CSSProperties = {
  height: "calc((100cqw - (var(--card-span, 2) - 1) * var(--card-gap, 0px)) / var(--card-span, 2) * 1.25)",
};

export function ProductCard({
  product,
  priority = false,
  headingLevel = 3,
  layout = "default",
  discoveryScents,
  sizes,
  className,
}: ProductCardProps) {
  const Heading = `h${headingLevel}` as const;
  const wide = layout === "wide";
  const rating = getRatingSummary(product.slug);
  const href = `/products/${product.slug}`;

  return (
    <article className={cn("group @container relative flex h-full flex-col", className)}>
      <Heading className="order-2 mt-4 text-[1.1875rem] leading-[1.15] md:mt-5 md:text-[1.375rem]">
        <Link
          href={href}
          className={cn(
            "underline-offset-4 decoration-1 group-hover:underline",
            // Stretched link: the whole card is the target.
            "after:absolute after:inset-0 after:z-1 after:rounded-card",
            "focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink",
          )}
        >
          {product.name}
        </Link>
      </Heading>

      <CardMedia
        product={product}
        wide={wide}
        priority={priority}
        sizes={sizes ?? (wide ? WIDE_SIZES : DEFAULT_SIZES)}
        discoveryScents={discoveryScents}
      />

      <div className="order-3 flex flex-1 flex-col">
        {isStick(product) ? <NotesLabel stick={product} placement="details" /> : null}
        {rating ? <Stars rating={rating} className="mt-2" /> : null}
        <p className="mt-1.5 text-sm leading-snug text-ink-soft md:text-[0.9375rem]">
          {isStick(product) ? product.mood : product.tagline}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4 @max-[14.5rem]:flex-col @max-[14.5rem]:flex-nowrap @max-[14.5rem]:items-stretch @max-[14.5rem]:gap-2.5">
          <CardPrice product={product} />
          <QuickAdd product={product} className="@max-[14.5rem]:w-full" />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

function CardMedia({
  product,
  wide,
  priority,
  sizes,
  discoveryScents,
}: {
  product: Product;
  wide: boolean;
  priority: boolean;
  sizes: string;
  discoveryScents?: readonly DiscoveryScent[];
}) {
  const hasPhoto = Boolean(getProductImage(product.slug, "packshot")?.src);
  const stick = isStick(product) ? product : null;

  return (
    <div
      className={cn(
        "relative order-1 w-full overflow-hidden rounded-card",
        "motion-safe:transition-shadow motion-safe:duration-300 group-hover:shadow-soft",
        !wide && "aspect-[4/5]",
      )}
      style={{ ...(wide ? WIDE_MEDIA_STYLE : null), backgroundImage: SLOT_TONES.sand.background }}
    >
      {stick && !hasPhoto ? (
        // Specimen layout: the stick stands tall on the left, the label sits
        // bottom right, so the ring at the base of the stick is never covered.
        <div aria-hidden="true" className="absolute inset-y-[6%] left-0 flex w-[36%] justify-center md:inset-y-[5%] md:w-[48%]">
          <StickRender
            ringColor={stick.ringColor}
            className="h-full w-auto motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:-translate-y-1"
          />
        </div>
      ) : (
        <ProductMedia
          product={product}
          aspect="fill"
          tone="sand"
          decorative
          priority={priority}
          sizes={sizes}
          discoveryScents={discoveryScents}
        />
      )}

      {stick ? <NotesLabel stick={stick} placement="media" /> : null}

      {product.badges.length > 0 ? (
        <div className="absolute top-2.5 right-2.5 flex flex-wrap justify-end gap-1.5 md:top-3.5 md:right-3.5">
          {product.badges.map((badge) => (
            <Badge key={badge} badge={badge} size="sm" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Family and the three card notes, one per line, on a solid fog panel at the
 * bottom right of the media (never text on a ring colour or a photo).
 */
/** Notes are stored lower case; cards show them with a capital, like the product page chips. */
function capitalise(note: string): string {
  return note.charAt(0).toUpperCase() + note.slice(1);
}

function NotesLabel({ stick, placement }: { stick: StickProduct; placement: "media" | "details" }) {
  const notes = getCardNotes(stick).map(capitalise);

  if (placement === "details") {
    // Large-text fallback below a card width of 8rem: in the flow under the name, free to wrap.
    // Hidden (display: none) otherwise.
    return (
      <div className="mt-2 hidden break-words @max-[8rem]:block">
        <p className="label-caps flex flex-wrap items-center gap-1 text-ink-soft">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 shrink-0 rounded-full ring-1 ring-ink-soft/60"
            style={{ backgroundColor: stick.ringColor }}
          />
          <span className="min-w-0">{stick.family}</span>
        </p>
        <p className="mt-1 text-xs leading-snug text-ink">
          <span className="sr-only">{productCard.notesLabel}: </span>
          {notes.join(", ")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute right-2 bottom-2 w-[62%] rounded-[10px] bg-fog px-2 py-2 shadow-[0_1px_2px_rgb(16_20_24/0.08)] md:right-3 md:bottom-3 md:w-[54%] md:px-3 md:py-2.5 xl:px-3.5 xl:py-3",
        // Below 8rem (large text only, see ProductCard) the label moves to the details.
        "@max-[8rem]:hidden",
      )}
    >
      {/*
        The ring-colour dot ties the label to the stick (on phones the six tubes differ only by
        their ring). The label is narrow on phones, so "AROMATIC" plus the dot must fit: below md
        the dot and gap are smaller, below 390 px the type is slightly smaller, and below 360 px
        the dot gives way.
      */}
      <p className="label-caps flex items-center gap-1 text-ink-soft max-[389px]:text-[0.6875rem] max-[389px]:tracking-[0.08em] md:gap-2">
        <span
          aria-hidden="true"
          className="inline-block size-1.5 shrink-0 rounded-full ring-1 ring-ink-soft/60 max-[359px]:hidden md:size-2"
          style={{ backgroundColor: stick.ringColor }}
        />
        {stick.family}
      </p>
      <p className="mt-1 text-xs leading-4 text-ink max-[359px]:text-[0.6875rem] md:mt-1.5 lg:text-[0.8125rem] lg:leading-[1.125rem]">
        <span className="sr-only">
          {productCard.notesLabel}: {notes.join(", ")}
        </span>
        <span aria-hidden="true">
          {notes.map((note) => (
            <span key={note} className="block">
              {note}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Price                                                               */
/* ------------------------------------------------------------------ */

function CardPrice({ product }: { product: Product }) {
  const amount = getFromPrice(product);
  if (hasFromPrice(product)) {
    return <span className="tabular text-base font-semibold text-ink">{productCard.from(formatMoneyShort(amount))}</span>;
  }
  return <Price amount={amount} previousPrice={product.previousPrice} />;
}
