import { Lock, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { pdp, type TrustItem } from "@/content/pdp";
import { cn } from "@/lib/cn";

/**
 * Trust row under the add-to-cart button (brief §6, docs/PLAN.md §9): secure
 * payment, free shipping from the threshold in content/shipping.ts and the
 * guarantee (offers.guaranteeDays), each with a small line icon. The copy is
 * built in content/pdp.ts from config, so amounts and days never drift.
 *
 * The 14-day statutory right of withdrawal is never a trust item: it is a
 * legal right, not a selling point (docs/PLAN.md §13).
 *
 * `digital` (the e-gift card) leaves out the shipping item, and the guarantee
 * too: it does not cover gift cards (D28). Server-compatible.
 */

export interface TrustRowProps {
  /** Digital product (e-gift card): no shipping and no guarantee item. */
  digital?: boolean;
  className?: string;
}

const ICONS: Record<TrustItem["id"], LucideIcon> = {
  "secure-payment": Lock,
  "free-shipping": Truck,
  guarantee: ShieldCheck,
};

/** Items that do not apply to a digital product. */
const PHYSICAL_ONLY = new Set<TrustItem["id"]>(["free-shipping", "guarantee"]);

export function TrustRow({ digital = false, className }: TrustRowProps) {
  const items = pdp.trust.items.filter((item) => !digital || !PHYSICAL_ONLY.has(item.id));
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="sr-only">{pdp.trust.label}</h2>
      <ul role="list" className="flex flex-col divide-y divide-line">
        {items.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <li key={item.id} className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-ink">
                <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
              </span>
              <p className="min-w-0 pt-0.5 text-sm leading-5">
                <span className="block font-semibold text-ink">{item.title}</span>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "mt-0.5 inline-block text-ink-soft underline decoration-ink/25 underline-offset-4",
                      "hover:text-ink hover:decoration-ink",
                    )}
                  >
                    {item.text}
                  </Link>
                ) : (
                  <span className="mt-0.5 block text-ink-soft">{item.text}</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
