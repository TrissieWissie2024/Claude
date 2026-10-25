import type { ReactNode } from "react";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyShort } from "@/lib/money";
import type { ProductBase } from "@/lib/types";

/**
 * A price in cents, formatted with formatMoney().
 *
 * Honest pricing (brief §2.4): a struck-through previous price renders only
 * when `previousPrice` is given, `lowestPriceLast30Days` is true and it is
 * higher than `amount`. No product has one at launch. Bundle savings are text
 * ("Save €14.90"), never a struck-through price.
 */

export type PriceSize = "sm" | "md" | "lg" | "xl";

export interface PriceProps {
  /** Price in cents. */
  amount: number;
  previousPrice?: ProductBase["previousPrice"];
  /** Text before the amount, e.g. "From". */
  prefix?: ReactNode;
  /** Text after the amount, e.g. "per stick" or "per delivery". */
  perUnit?: ReactNode;
  size?: PriceSize;
  /** "dark" for deep and kelp surfaces. */
  tone?: "light" | "dark";
  /** "short" drops ".00" on whole euros ("From €25"). Default "full" ("€25.00"). */
  format?: "full" | "short";
  /** Screen reader labels around a previous price. */
  labels?: { previous?: string; current?: string };
  className?: string;
}

const sizes: Record<PriceSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-[1.75rem] leading-none",
};

export function Price({
  amount,
  previousPrice,
  prefix,
  perUnit,
  size = "md",
  tone = "light",
  format = "full",
  labels,
  className,
}: PriceProps) {
  const money = format === "short" ? formatMoneyShort : formatMoney;
  const showPrevious =
    previousPrice !== undefined && previousPrice.lowestPriceLast30Days === true && previousPrice.amount > amount;
  const soft = tone === "dark" ? "text-mist" : "text-ink-soft";

  return (
    <span
      className={cn(
        "tabular inline-flex flex-wrap items-baseline gap-x-1.5",
        sizes[size],
        tone === "dark" ? "text-fog" : "text-ink",
        className,
      )}
    >
      {prefix ? <span className={cn("font-normal", soft)}>{prefix}</span> : null}
      {showPrevious ? (
        <s className={cn("font-normal", soft)}>
          <VisuallyHidden>{labels?.previous ?? site.ui.previousPrice} </VisuallyHidden>
          {money(previousPrice.amount)}
        </s>
      ) : null}
      <span className="font-semibold">
        {showPrevious ? <VisuallyHidden>{labels?.current ?? site.ui.currentPrice} </VisuallyHidden> : null}
        {money(amount)}
      </span>
      {perUnit ? <span className={cn("text-[0.8125em] font-normal", soft)}>{perUnit}</span> : null}
    </span>
  );
}
