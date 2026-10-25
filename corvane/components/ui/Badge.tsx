import type { ReactNode } from "react";

import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { BadgeId } from "@/lib/types";

/**
 * Merchandising tag in label caps. Render it from a product's `badges`
 * (only "new" at launch, brief §2.7) or as "best-value" on the 3-stick tile.
 * The text comes from site.badges.
 *
 * "New" is quiet (kelp text on fog with a hairline ring, 8.9 : 1): at launch
 * every product is new, so it must not be the loudest thing in a grid.
 * "Best value" stays signal, so it still stands out on the 3-stick tile.
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
  new: "bg-fog text-kelp ring-1 ring-kelp/25 ring-inset",
  "best-value": "bg-signal text-ink",
  neutral: "bg-sand text-ink",
};

export type BadgeSize = "sm" | "md";

const sizes: Record<BadgeSize, string> = {
  sm: "h-5 px-2 text-[0.6875rem] leading-none tracking-[0.12em]",
  md: "h-6 px-2.5",
};

interface BadgeBaseProps {
  tone?: BadgeTone;
  /** Default "md" (24 px); "sm" (20 px) inside product cards. */
  size?: BadgeSize;
  className?: string;
}

export type BadgeProps =
  | (BadgeBaseProps & { badge: BadgeKey; children?: undefined })
  | (BadgeBaseProps & { badge?: undefined; children: ReactNode });

export function Badge({ badge, tone, size = "md", className, children }: BadgeProps) {
  const resolvedTone = tone ?? (badge ? toneByBadge[badge] : "neutral");
  return (
    <span
      className={cn(
        "label-caps inline-flex items-center rounded-full whitespace-nowrap",
        sizes[size],
        tones[resolvedTone],
        className,
      )}
    >
      {badge ? site.badges[badge] : children}
    </span>
  );
}
