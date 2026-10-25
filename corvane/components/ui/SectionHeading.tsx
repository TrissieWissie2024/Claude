import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Eyebrow (label caps) + serif heading + optional intro.
 * `level` sets the heading element; `size` defaults from it (1 -> xl,
 * 2 -> lg, 3 -> md). `action` is an optional slot (a link or a select) that
 * sits to the right of the heading from md up.
 */

export type SectionHeadingSize = "xl" | "lg" | "md";

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
  className?: string;
}

const titleSizes: Record<SectionHeadingSize, string> = {
  xl: "text-[2.625rem] leading-[1.04] md:text-[4.25rem]",
  lg: "text-[2.125rem] leading-[1.08] md:text-[3.25rem]",
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
  className,
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;
  const centered = align === "center";
  const dark = tone === "dark";

  const text = (
    <div className={cn("flex flex-col", centered && "items-center text-center")}>
      {eyebrow ? (
        <p className={cn("label-caps mb-4 flex items-center gap-3", dark ? "text-mist" : "text-ink-soft")}>
          <span aria-hidden="true" className="h-px w-6 bg-signal" />
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
