import type { CSSProperties } from "react";
import Image from "next/image";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { aspectToCss, getImageAsset, placeholderCopy, type ImageAssetKey, type MediaAspect } from "@/content/assets";
import { cn } from "@/lib/cn";

/**
 * A photo slot from content/assets.ts. When the manifest has a `src` for the
 * key, it renders next/image (fill, object-cover). Otherwise a tidy placeholder
 * in the same aspect ratio: a soft gradient in brand tones, a small vane mark
 * and the label "PHOTO: <label>".
 */

export type SlotTone = "sand" | "fog" | "deep" | "kelp";

/** Background gradients and text colours per tone (text passes AA on every stop). */
export const SLOT_TONES: Record<SlotTone, { background: string; text: string }> = {
  sand: {
    background: "radial-gradient(120% 90% at 30% 18%, #F5F0E7 0%, #EEE6D8 48%, #E3D9C7 100%)",
    text: "text-ink-soft",
  },
  fog: {
    background: "radial-gradient(120% 90% at 30% 18%, #FFFFFF 0%, #F7F5F1 50%, #ECE8E0 100%)",
    text: "text-ink-soft",
  },
  deep: {
    background: "radial-gradient(120% 90% at 30% 18%, #1A4054 0%, #0F2733 55%, #0B1E28 100%)",
    text: "text-mist",
  },
  kelp: {
    background: "radial-gradient(120% 90% at 30% 18%, #3B5C4F 0%, #2E4A3F 55%, #253D33 100%)",
    text: "text-fog",
  },
};

/** Default `sizes` for slots: full width on mobile, half on desktop. */
export const DEFAULT_SLOT_SIZES = "(min-width: 1024px) 50vw, 100vw";

/** "4:5" or "fill" (absolutely fills a positioned parent). */
export type SlotAspect = MediaAspect | "fill";

export function slotFrame(aspect: SlotAspect): { className: string; style: CSSProperties } {
  return aspect === "fill"
    ? { className: "absolute inset-0", style: {} }
    : { className: "relative w-full", style: { aspectRatio: aspectToCss(aspect) } };
}

/** Adds the prefix unless the label already starts with it (some copy includes it). */
export function withPrefix(prefix: string, label: string): string {
  return label.trim().toUpperCase().startsWith(prefix.toUpperCase()) ? label : `${prefix} ${label}`;
}

export interface PhotoSlotProps {
  /** Manifest key, e.g. "lifestyle.gym" or "products.north-swell.inHand". */
  assetKey?: ImageAssetKey;
  /** Placeholder label; shown as "PHOTO: <label>". */
  label: string;
  /** Aspect ratio, or "fill" for a positioned parent. Default: the asset's ratio, else "4:5". */
  aspect?: SlotAspect;
  /** Placeholder background. Default "sand". */
  tone?: SlotTone;
  className?: string;
  /** Preload the photo (LCP images only). Maps to next/image `preload`. */
  priority?: boolean;
  /** next/image sizes. Default "(min-width: 1024px) 50vw, 100vw". */
  sizes?: string;
  /** Overrides the manifest alt text. Pass "" for a decorative photo. */
  alt?: string;
}

export function PhotoSlot({
  assetKey,
  label,
  aspect,
  tone = "sand",
  className,
  priority = false,
  sizes = DEFAULT_SLOT_SIZES,
  alt,
}: PhotoSlotProps) {
  const asset = assetKey ? getImageAsset(assetKey) : null;
  const frame = slotFrame(aspect ?? asset?.aspect ?? "4:5");

  if (asset?.src) {
    return (
      <div className={cn("overflow-hidden", frame.className, className)} style={frame.style}>
        <Image
          src={asset.src}
          alt={alt ?? asset.alt}
          fill
          sizes={sizes}
          className="object-cover"
          preload={priority}
        />
      </div>
    );
  }

  return <SlotPlaceholder text={withPrefix(placeholderCopy.photoPrefix, label)} tone={tone} frame={frame} className={className} />;
}

/** The shared placeholder of PhotoSlot and VideoSlot. */
export function SlotPlaceholder({
  text,
  tone,
  frame,
  className,
}: {
  text: string;
  tone: SlotTone;
  frame: { className: string; style: CSSProperties };
  className?: string;
}) {
  const t = SLOT_TONES[tone];
  return (
    <div
      className={cn("overflow-hidden", frame.className, t.text, className)}
      style={{ ...frame.style, backgroundImage: t.background }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <VaneIcon className="size-6 opacity-50" />
        <p className="label-caps max-w-[22ch] text-balance">{text}</p>
      </div>
    </div>
  );
}
