import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Eyebrow (label caps) + serif heading + optional intro.
 * `level` sets the heading element; `size` defaults from it (1 -> xl,
 * 2 -> lg, 3 -> md). `action` is an optional slot (a link or a select) that
 * sits to the right of the heading from md up. The short rule before the
 * eyebrow is signal by default (homepage); `eyebrowRule="neutral"` draws it in
 * ink-soft (mist on dark), for pages where signal is kept for the one primary
 * button (product page, collection).
 *
 * Sizes step up at md and lg, so a section h2 never outranks the homepage
 * h1 (Hero: 40-44 / 48 / 68 / 78 px at base / md / lg / xl):
 * - xl: page h1s, 42 / 56 / 68 px.
 * - display: an h2 set as a display line (one per page at most),
 *   38 / 46 / 60 / 64 px.
 * - lg: section h2s, 34 / 44 / 52 px.
 * - md: 26 / 34 px.
 */

export type SectionHeadingSize = "xl" | "display" | "lg" | "md";

export interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  level?: 1 | 2 | 3;
  size?: SectionHeadingSize;
  align?: "left" | "center";
  /** "dark" for deep and kelp surfaces. */
  tone?: "light" | "dark";
  /** id on the heading, for aria-labelledby on the section. */
  id?: string;
  action?: ReactNode;
  /** Colour of the short rule before the eyebrow. Default "signal". */
  eyebrowRule?: "signal" | "neutral";
  className?: string;
}

const titleSizes: Record<SectionHeadingSize, string> = {
  xl: "text-[2.625rem] leading-[1.04] md:text-[3.5rem] lg:text-[4.25rem]",
  display: "text-[2.375rem] leading-[1.02] tracking-[-0.02em] md:text-[2.875rem] lg:text-[3.75rem] xl:text-[4rem]",
  lg: "text-[2.125rem] leading-[1.08] md:text-[2.75rem] lg:text-[3.25rem]",
  md: "text-[1.625rem] leading-[1.15] md:text-[2.125rem]",
};

const defaultSize: Record<1 | 2 | 3, SectionHeadingSize> = { 1: "xl", 2: "lg", 3: "md" };

export function SectionHeading({
  eyebrow,
  title,
  intro,
  level = 2,
  size,
  align = "left",
  tone = "light",
  id,
  action,
  eyebrowRule = "signal",
  className,
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;
  const centered = align === "center";
  const dark = tone === "dark";

  const text = (
    <div className={cn("flex flex-col", centered && "items-center text-center")}>
      {eyebrow ? (
        <p className={cn("label-caps mb-4 flex items-center gap-3", dark ? "text-mist" : "text-ink-soft")}>
          <span
            aria-hidden="true"
            className={cn("h-px w-6", eyebrowRule === "signal" ? "bg-signal" : dark ? "bg-mist/60" : "bg-ink-soft/50")}
          />
          {eyebrow}
        </p>
      ) : null}
      <Heading id={id} className={cn(titleSizes[size ?? defaultSize[level]], dark ? "text-fog" : "text-ink")}>
        {title}
      </Heading>
      {intro ? (
        <div
          className={cn(
            "mt-4 max-w-[36rem] text-base leading-relaxed text-pretty md:mt-5 md:text-lg",
            dark ? "text-mist" : "text-ink-soft",
          )}
        >
          {intro}
        </div>
      ) : null}
    </div>
  );

  if (!action) return <div className={className}>{text}</div>;

  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10",
        centered && "items-center md:flex-col md:items-center",
        className,
      )}
    >
      {text}
      <div className="shrink-0">{action}</div>
    </div>
  );
}
