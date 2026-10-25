import Image from "next/image";

import { getProductImage, type ProductShot } from "@/content/assets";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

import { DiscoverySetRender, type DiscoveryScent } from "./DiscoverySetRender";
import { GiftCardRender } from "./GiftCardRender";
import { DEFAULT_SLOT_SIZES, PhotoSlot, SLOT_TONES, slotFrame } from "./PhotoSlot";
import { PouchRender } from "./PouchRender";
import { StickRender } from "./StickRender";

/**
 * The image of a product in one of its three photo slots (docs/PLAN.md §14):
 * - a photo from content/assets.ts when its `src` is set;
 * - otherwise, for the packshot, the SVG render of the product (stick,
 *   Discovery Set, Travel Pouch or gift card) on a soft tone backdrop;
 * - otherwise, for in-hand and lifestyle, a PhotoSlot placeholder.
 * Always 4:5 unless `aspect="fill"` (then it fills a positioned parent).
 */

export type ProductMediaVariant = "packshot" | "in-hand" | "lifestyle";

const SHOTS: Record<ProductMediaVariant, ProductShot> = {
  packshot: "packshot",
  "in-hand": "inHand",
  lifestyle: "lifestyle",
};

export type ProductMediaTone = "sand" | "fog" | "deep";

export interface ProductMediaProps {
  product: Product;
  /** Default "packshot". */
  variant?: ProductMediaVariant;
  /** Preload a supplied photo (LCP only). */
  priority?: boolean;
  /** "4:5" (default) or "fill" for a positioned parent. */
  aspect?: "4:5" | "fill";
  /** Backdrop behind renders and placeholders. Default "sand". */
  tone?: ProductMediaTone;
  className?: string;
  /** next/image sizes for supplied photos. */
  sizes?: string;
  /** Hide from assistive technology, e.g. in a card whose link already names the product. */
  decorative?: boolean;
  /** Ring colours for the Discovery Set render (pass the six sticks from the catalog). */
  discoveryScents?: readonly DiscoveryScent[];
  /** Amount on the gift card render, e.g. "€50". */
  giftCardAmount?: string;
}

export function ProductMedia({
  product,
  variant = "packshot",
  priority = false,
  aspect = "4:5",
  tone = "sand",
  className,
  sizes = DEFAULT_SLOT_SIZES,
  decorative = false,
  discoveryScents,
  giftCardAmount,
}: ProductMediaProps) {
  const asset = getProductImage(product.slug, SHOTS[variant]);
  const frame = slotFrame(aspect);

  if (asset?.src) {
    return (
      <div className={cn("overflow-hidden", frame.className, className)} style={frame.style}>
        <Image
          src={asset.src}
          alt={decorative ? "" : asset.alt}
          fill
          sizes={sizes}
          className="object-cover"
          preload={priority}
        />
      </div>
    );
  }

  if (variant !== "packshot") {
    const label =
      variant === "in-hand" ? pdp.gallery.placeholders.inHand(product.name) : pdp.gallery.placeholders.lifestyle(product.name);
    return (
      <PhotoSlot
        assetKey={asset?.key}
        label={label}
        aspect={aspect}
        tone={tone}
        className={className}
        priority={priority}
        sizes={sizes}
      />
    );
  }

  return (
    <div
      className={cn("overflow-hidden", frame.className, className)}
      style={{ ...frame.style, backgroundImage: SLOT_TONES[tone].background }}
    >
      <PackshotRender
        product={product}
        dark={tone === "deep"}
        decorative={decorative}
        discoveryScents={discoveryScents}
        giftCardAmount={giftCardAmount}
      />
    </div>
  );
}

function PackshotRender({
  product,
  dark,
  decorative,
  discoveryScents,
  giftCardAmount,
}: {
  product: Product;
  dark: boolean;
  decorative: boolean;
  discoveryScents?: readonly DiscoveryScent[];
  giftCardAmount?: string;
}) {
  switch (product.kind) {
    case "stick":
      return (
        <div className="absolute inset-x-0 bottom-[5%] top-[7%] flex justify-center">
          <StickRender ringColor={product.ringColor} name={decorative ? undefined : product.name} rimLight={dark} />
        </div>
      );
    case "discovery-set":
      return (
        <div className="absolute inset-0 flex justify-center">
          <DiscoverySetRender scents={discoveryScents} decorative={decorative} />
        </div>
      );
    case "pouch":
      return (
        <div className="absolute inset-0 flex justify-center">
          <PouchRender decorative={decorative} />
        </div>
      );
    case "gift-card":
      return (
        <div className="absolute inset-0 flex items-center justify-center px-[6%]">
          <GiftCardRender amount={giftCardAmount} decorative={decorative} />
        </div>
      );
  }
}
