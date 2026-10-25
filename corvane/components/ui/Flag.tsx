import { shipping } from "@/content/shipping";
import { cn } from "@/lib/cn";
import type { CountryCode } from "@/lib/types";

/**
 * Inline SVG flags for the shipping countries, drawn at 4:3 so they line up.
 * Labelled with the country name from content/shipping.ts; pass
 * `decorative` when the name is already written next to it.
 */

export interface FlagProps {
  country: CountryCode;
  /** Accessible name. Defaults to the country name. */
  label?: string;
  /** Hide from screen readers (the country name is visible nearby). */
  decorative?: boolean;
  className?: string;
}

function Stripes({ country }: { country: CountryCode }) {
  switch (country) {
    case "NL":
      return (
        <>
          <rect width="24" height="6" fill="#AE1C28" />
          <rect y="6" width="24" height="6" fill="#FFFFFF" />
          <rect y="12" width="24" height="6" fill="#21468B" />
        </>
      );
    case "BE":
      return (
        <>
          <rect width="8" height="18" fill="#1A1A1A" />
          <rect x="8" width="8" height="18" fill="#FDDA24" />
          <rect x="16" width="8" height="18" fill="#EF3340" />
        </>
      );
  }
}

export function Flag({ country, label, decorative = false, className }: FlagProps) {
  const name = label ?? shipping.countries.find((entry) => entry.code === country)?.name ?? country;
  return (
    <svg
      viewBox="0 0 24 18"
      width="20"
      height="15"
      className={cn("inline-block shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgb(16_20_24/0.12)]", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      <Stripes country={country} />
    </svg>
  );
}
