"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

import { home } from "@/content/home";
import { isSortKey, type SortKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";

/**
 * Sort control for product grids: a native <select> (keyboard and screen
 * reader behaviour for free), styled as a pill with its label beside it.
 * Options and label come from content/home.ts (productGrid.sort), shared with
 * the collection page; values match lib/catalog SortKey and the `?sort=` param.
 */

export interface SortOption {
  value: SortKey;
  label: string;
}

export interface SortSelectProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  /** Visible label. Default "Sort by". */
  label?: string;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  options?: readonly SortOption[];
  id?: string;
  className?: string;
}

export function SortSelect({
  value,
  onChange,
  label = home.productGrid.sort.label,
  hideLabel = false,
  options = home.productGrid.sort.options,
  id,
  className,
}: SortSelectProps) {
  const generatedId = useId();
  const selectId = id ?? `sort-${generatedId}`;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <label htmlFor={selectId} className={cn(hideLabel ? "sr-only" : "text-sm text-ink-soft")}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(event) => {
            if (isSortKey(event.target.value)) onChange(event.target.value);
          }}
          className={cn(
            "h-11 cursor-pointer appearance-none rounded-full border border-ink/25 bg-fog pr-10 pl-4",
            "font-sans text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink/60",
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink"
        />
      </div>
    </div>
  );
}
