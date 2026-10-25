import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Small rounded label, e.g. USP pills in the hero or note chips.
 * - light: fog pill with a hairline, for sand and deep surfaces (and fog).
 * - dark: deep pill with fog text, for light surfaces.
 * - outline: hairline only, for light surfaces.
 * - outline-on-dark: hairline only, for deep and kelp surfaces.
 */

export type PillTone = "light" | "dark" | "outline" | "outline-on-dark";

export type PillSize = "sm" | "md";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  size?: PillSize;
  /** Decorative icon before the label (mark it aria-hidden). */
  icon?: ReactNode;
  children: ReactNode;
}

const tones: Record<PillTone, string> = {
  light: "bg-fog text-ink ring-1 ring-inset ring-line",
  dark: "bg-deep text-fog",
  outline: "text-ink ring-1 ring-inset ring-ink/20",
  "outline-on-dark": "text-fog ring-1 ring-inset ring-fog/25",
};

const sizes: Record<PillSize, string> = {
  sm: "h-7 gap-1.5 px-3 text-xs",
  md: "h-8 gap-2 px-3.5 text-[13px]",
};

export function Pill({ tone = "light", size = "md", icon, className, children, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-sans font-medium leading-none whitespace-nowrap",
        tones[tone],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon ? <span className="inline-flex shrink-0 [&>svg]:size-[1.15em]">{icon}</span> : null}
      {children}
    </span>
  );
}
