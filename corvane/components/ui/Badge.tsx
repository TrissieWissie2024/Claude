import type { ReactNode } from "react";

import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { BadgeId } from "@/lib/types";

/**
 * Merchandising tag in label caps. Render it from a product's `badges`
 * (only "new" at launch, brief §2.7) or as "best-value" on the 3-stick tile.
 * The text comes from site.badges.
 */

export type BadgeTone = "new" | "best-value" | "neutral";

/** Badge ids with a label in site.badges. */
export type BadgeKey = BadgeId | "best-value";

const toneByBadge: Record<BadgeKey, BadgeTone> = {
  new: "new",
  "best-value": "best-value",
  "best-seller": "neutral",
  "most-popular": "neutral",
};

const tones: Record<BadgeTone, string> = {
  new: "bg-kelp text-fog",
  "best-value": "bg-signal text-ink",
  neutral: "bg-sand text-ink",
};

interface BadgeBaseProps {
  tone?: BadgeTone;
  className?: string;
}

export type BadgeProps =
  | (BadgeBaseProps & { badge: BadgeKey; children?: undefined })
  | (BadgeBaseProps & { badge?: undefined; children: ReactNode });

export function Badge({ badge, tone, className, children }: BadgeProps) {
  const resolvedTone = tone ?? (badge ? toneByBadge[badge] : "neutral");
  return (
    <span
      className={cn(
        "label-caps inline-flex h-6 items-center rounded-full px-2.5 whitespace-nowrap",
        tones[resolvedTone],
        className,
      )}
    >
      {badge ? site.badges[badge] : children}
    </span>
  );
}
