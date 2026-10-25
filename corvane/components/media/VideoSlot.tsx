import { getVideoAsset, placeholderCopy, type VideoAssetId, type VideoAssetKey } from "@/content/assets";
import { cn } from "@/lib/cn";

import { SlotPlaceholder, slotFrame, withPrefix, type SlotTone } from "./PhotoSlot";

/**
 * A 9:16 video slot from content/assets.ts ("From CORVANE" row). When the
 * manifest has a `src`, it renders a native <video> with controls: muted,
 * playsInline, preload="none" and the poster frame. It never autoplays.
 * Otherwise a placeholder "VIDEO: <label>" in the same ratio.
 */

export interface VideoSlotProps {
  /** "ugc.1" ... "ugc.4" or the file id "ugc-01" ... "ugc-04". */
  assetKey?: VideoAssetKey | VideoAssetId;
  /** Placeholder label; shown as "VIDEO: <label>" (a label that already starts with "VIDEO:" is kept). */
  label: string;
  className?: string;
  /** Placeholder background. Default "deep". */
  tone?: SlotTone;
}

export function VideoSlot({ assetKey, label, className, tone = "deep" }: VideoSlotProps) {
  const asset = assetKey ? getVideoAsset(assetKey) : null;
  const frame = slotFrame("9:16");

  if (asset?.src) {
    return (
      <div className={cn("overflow-hidden bg-deep", frame.className, className)} style={frame.style}>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          controls
          preload="none"
          poster={asset.poster ?? undefined}
          aria-label={asset.alt}
          width={asset.width}
          height={asset.height}
        >
          <source src={asset.src} type="video/mp4" />
        </video>
      </div>
    );
  }

  return <SlotPlaceholder text={withPrefix(placeholderCopy.videoPrefix, label)} tone={tone} frame={frame} className={className} />;
}
