import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { RatingSummary } from "@/lib/types";

/**
 * Star rating from real reviews only (brief §2.2). Pass the result of
 * getRatingSummary() from lib/reviews.ts: it is null while content/reviews.ts
 * is empty, and then this renders nothing.
 */

export interface StarsProps {
  rating: RatingSummary | null;
  size?: "sm" | "md";
  /** Show "4.6 (12)" next to the stars. Default true. */
  showCount?: boolean;
  /** "dark" for deep and kelp surfaces. */
  tone?: "light" | "dark";
  /** Accessible label. Default "Rated 4.6 out of 5, based on 12 reviews". */
  label?: (rating: RatingSummary) => string;
  className?: string;
}

const STAR_PATH =
  "M12 2.6l2.83 6.08 6.67.78-4.93 4.56 1.31 6.58L12 17.3l-5.88 3.3 1.31-6.58L2.5 9.46l6.67-.78L12 2.6z";

function defaultLabel({ average, count }: RatingSummary): string {
  return site.ui.rating(average.toFixed(1), count);
}

function StarRow({ className }: { className: string }) {
  return (
    <span className={cn("flex gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <svg key={index} viewBox="0 0 24 24" aria-hidden="true" className="size-[1em] shrink-0 fill-current">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

export function Stars({ rating, size = "sm", showCount = true, tone = "light", label = defaultLabel, className }: StarsProps) {
  if (!rating || rating.count <= 0) return null;
  const percent = Math.max(0, Math.min(100, (rating.average / 5) * 100));
  const dark = tone === "dark";

  return (
    <span className={cn("inline-flex items-center gap-2", size === "sm" ? "text-[0.9375rem]" : "text-lg", className)}>
      <span role="img" aria-label={label(rating)} className="relative inline-flex">
        <StarRow className={dark ? "text-fog/25" : "text-ink/15"} />
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
          <StarRow className={dark ? "text-fog" : "text-ink"} />
        </span>
      </span>
      {showCount ? (
        <span aria-hidden="true" className={cn("tabular text-sm", dark ? "text-mist" : "text-ink-soft")}>
          {rating.average.toFixed(1)} ({rating.count})
        </span>
      ) : null}
    </span>
  );
}
