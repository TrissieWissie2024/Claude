import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Accepted payment methods (site.paymentMethods) as small neutral badges with
 * the method's name as text. We draw our own badges on purpose: no payment
 * brand logos, colours or marks are reproduced.
 *
 * `tone` is the surface the badges sit on:
 * - light: fog, sand or white (cart drawer, checkout).
 * - dark: deep or kelp (footer).
 *
 * `size` "sm" is a compact row that fits all six methods on one line in a
 * 350 px column (the cart drawer on a 390 px phone); "md" is the default;
 * "auto" is sm below md and md from md (the footer).
 *
 * A list with the accessible name site.paymentMethodsLabel. No hooks, so it
 * renders in server and client components alike. Pass `className` to align it
 * (e.g. "justify-center").
 */

export type PaymentIconsTone = "light" | "dark";

export type PaymentIconsSize = "sm" | "md" | "auto";

export interface PaymentIconsProps {
  tone?: PaymentIconsTone;
  size?: PaymentIconsSize;
  className?: string;
}

const tones: Record<PaymentIconsTone, string> = {
  light: "bg-white text-ink-soft ring-line",
  dark: "bg-fog/[0.06] text-mist ring-line-on-deep",
};

const sizes: Record<PaymentIconsSize, { list: string; item: string }> = {
  sm: { list: "gap-1", item: "h-[22px] px-1.5 text-[10px]" },
  md: { list: "gap-1.5", item: "h-6 px-2 text-[11px]" },
  auto: { list: "gap-1 md:gap-1.5", item: "h-[22px] px-1.5 text-[10px] md:h-6 md:px-2 md:text-[11px]" },
};

export function PaymentIcons({ tone = "light", size = "md", className }: PaymentIconsProps) {
  return (
    // role="list" keeps list semantics in Safari, which drops them for list-style: none.
    <ul role="list" aria-label={site.paymentMethodsLabel} className={cn("flex flex-wrap", sizes[size].list, className)}>
      {site.paymentMethods.map((method) => (
        <li
          key={method.id}
          className={cn(
            "inline-flex items-center rounded-md leading-none font-semibold tracking-[0.01em] whitespace-nowrap ring-1 ring-inset",
            sizes[size].item,
            tones[tone],
          )}
        >
          {method.label}
        </li>
      ))}
    </ul>
  );
}
