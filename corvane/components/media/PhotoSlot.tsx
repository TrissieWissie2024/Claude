import type { CSSProperties } from "react";
import Image from "next/image";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { aspectToCss, getImageAsset, placeholderCopy, type ImageAssetKey, type MediaAspect } from "@/content/assets";
import { cn } from "@/lib/cn";

/**
 * A photo slot from content/assets.ts. When the manifest has a `src` for the
 * key, it renders next/image (fill, object-cover). Otherwise a tidy placeholder
 * in the same aspect ratio: a soft gradient in brand tones, a small vane mark,
 * the kind ("PHOTO") as a small caps line and the label on its own line under
 * it (read as "PHOTO: <label>").
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

/** The label without a leading prefix ("VIDEO: Gym bag" -> "Gym bag"); some copy includes it. */
export function stripPrefix(prefix: string, label: string): string {
  const trimmed = label.trim();
  return trimmed.toUpperCase().startsWith(prefix.toUpperCase()) ? trimmed.slice(prefix.length).trim() : trimmed;
}

export interface PhotoSlotProps {
  /** Manifest key, e.g. "lifestyle.gym" or "products.north-swell.inHand". */
  assetKey?: ImageAssetKey;
  /** Placeholder label, shown under "PHOTO" (a leading "PHOTO:" in the copy is dropped). */
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

  return (
    <SlotPlaceholder
      prefix={placeholderCopy.photoPrefix}
      text={stripPrefix(placeholderCopy.photoPrefix, label)}
      tone={tone}
      frame={frame}
      className={className}
    />
  );
}

/**
 * The shared placeholder of PhotoSlot and VideoSlot: the kind ("PHOTO:", shown without the colon)
 * as a small caps line, the label as its own line under it.
 */
export function SlotPlaceholder({
  prefix,
  text,
  tone,
  frame,
  className,
}: {
  /** "PHOTO:" or "VIDEO:" (placeholderCopy). */
  prefix: string;
  /** The label, without the prefix. */
  text: string;
  tone: SlotTone;
  frame: { className: string; style: CSSProperties };
  className?: string;
}) {
  const t = SLOT_TONES[tone];
  const kind = prefix.replace(/:\s*$/, "");
  return (
    <div
      className={cn("overflow-hidden", frame.className, t.text, className)}
      style={{ ...frame.style, backgroundImage: t.background }}
    >
      {/*
        Icon, kind and label sit at fixed heights (the block is centred for a one-line label) and a
        longer label hangs below, so a row of slots lines up whatever the label lengths.
        24 px icon + 12 px gap + 16 px kind + 6 px gap + 20 px label = 78 px, half is 2.4375rem.
      */}
      <div className="absolute inset-x-0 top-[calc(50%-2.4375rem)] flex flex-col items-center gap-3 px-5 text-center">
        <VaneIcon className="size-6 opacity-50" />
        <p className="flex flex-col items-center gap-1.5">
          <span className="label-caps">
            {kind}
            <span className="sr-only">:</span>
          </span>
          <span className="max-w-[24ch] text-sm leading-5 font-medium text-balance">{text}</span>
        </p>
      </div>
    </div>
  );
}
