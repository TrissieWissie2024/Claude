"use client";

import { Minus, Plus } from "lucide-react";

import { cartCopy } from "@/content/cart";
import { cn } from "@/lib/cn";
import { MAX_LINE_QUANTITY } from "@/lib/catalog";

/**
 * − / value / + stepper for a quantity. The buttons at the limits are marked
 * aria-disabled instead of disabled, so they keep focus (a disabled button
 * drops focus to <body>, which would break the drawer's focus trap) and a
 * screen reader still reads them as unavailable. The value is plain text; the
 * cart provider announces changes in its live region.
 */

export interface QuantityStepperProps {
  value: number;
  /** Called with the next value (already clamped to min ... max). */
  onChange: (next: number) => void;
  /** Name of the item, used in the accessible labels ("Increase quantity of North Swell"). */
  itemName: string;
  /** Default 1. */
  min?: number;
  /** Default MAX_LINE_QUANTITY (99). */
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

const sizes = {
  sm: { box: "h-9", button: "size-9", value: "min-w-7 text-sm", icon: "size-3.5" },
  md: { box: "h-11", button: "size-11", value: "min-w-9 text-[15px]", icon: "size-4" },
} as const;

export function QuantityStepper({
  value,
  onChange,
  itemName,
  min = 1,
  max = MAX_LINE_QUANTITY,
  size = "sm",
  className,
}: QuantityStepperProps) {
  const s = sizes[size];
  const atMin = value <= min;
  const atMax = value >= max;
  const labels = cartCopy.line.quantity;

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  };

  const buttonClass = (disabled: boolean) =>
    cn(
      "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-150",
      s.button,
      disabled ? "cursor-not-allowed text-ink/30" : "text-ink hover:bg-ink/[0.06] active:bg-ink/10",
    );

  return (
    <div
      role="group"
      aria-label={labels.label(itemName)}
      className={cn("inline-flex items-center rounded-full ring-1 ring-inset ring-line", s.box, className)}
    >
      <button
        type="button"
        aria-label={labels.decrease(itemName)}
        aria-disabled={atMin || undefined}
        onClick={() => {
          if (!atMin) step(-1);
        }}
        className={buttonClass(atMin)}
      >
        <Minus aria-hidden="true" className={s.icon} strokeWidth={2} />
      </button>
      <span className={cn("tabular text-center font-semibold text-ink", s.value)}>{value}</span>
      <button
        type="button"
        aria-label={labels.increase(itemName)}
        aria-disabled={atMax || undefined}
        onClick={() => {
          if (!atMax) step(1);
        }}
        className={buttonClass(atMax)}
      >
        <Plus aria-hidden="true" className={s.icon} strokeWidth={2} />
      </button>
    </div>
  );
}
