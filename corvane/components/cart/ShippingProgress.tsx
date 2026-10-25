import { Check, Gift, Mail, Truck } from "lucide-react";
import type { ReactNode } from "react";

import { cartCopy } from "@/content/cart";
import { offers } from "@/content/offers";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyShort } from "@/lib/money";
import type { PricingSummary } from "@/lib/types";

/**
 * Two stacked indicators (docs/PLAN.md §10), read only from PricingSummary:
 * 1. euros towards free shipping (shipping.basis against shipping.freeFrom,
 *    the same basis as the pricing rule, D14);
 * 2. three steps towards the free Travel Pouch (one per order, D11).
 * Both are role="progressbar" with a value text. Fills animate only with
 * motion allowed. Gift-card-only carts show a one-line note instead.
 */

export interface ShippingProgressProps {
  pricing: PricingSummary;
  className?: string;
}

const MARK = "\u0000";

/** Renders a copy template with its value in bold: template("€12.05") -> "You are <strong>€12.05</strong> away ...". */
function emphasise(template: (value: string) => string, value: string): ReactNode {
  const parts = template(MARK).split(MARK);
  if (parts.length !== 2) return template(value);
  return (
    <>
      {parts[0]}
      <strong className="font-semibold text-ink">{value}</strong>
      {parts[1]}
    </>
  );
}

function Status({ icon, done, children }: { icon: ReactNode; done: boolean; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-[13px] leading-snug text-ink">
      <span
        aria-hidden="true"
        className={cn(
          "mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full",
          done ? "bg-kelp text-fog" : "text-ink-soft",
        )}
      >
        {done ? <Check className="size-3" strokeWidth={2.75} /> : icon}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

const fillClasses =
  "block h-full origin-left rounded-full bg-kelp motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out";

export function ShippingProgress({ pricing, className }: ShippingProgressProps) {
  const copy = cartCopy.progress;
  const { shipping, freePouch, stickCount } = pricing;

  if (!shipping.requiresShipping) {
    return (
      <section aria-label={copy.label} className={cn("rounded-card bg-sand px-4 py-3.5", className)}>
        <Status icon={<Mail className="size-4" strokeWidth={1.75} />} done={false}>
          {copy.shipping.notNeeded}
        </Status>
      </section>
    );
  }

  const target = Math.max(1, shipping.freeFrom);
  const reached = Math.min(shipping.basis, target);
  const shippingRatio = shipping.isFree ? 1 : reached / target;

  // One step per stick up to the threshold (3). Only the step count comes from config; progress comes from the summary.
  const steps = Math.max(1, offers.freePouch.minSticks);
  const filled = freePouch.eligible ? steps : Math.min(stickCount, steps);

  return (
    <section aria-label={copy.label} className={cn("space-y-4 rounded-card bg-sand px-4 py-4", className)}>
      <div>
        <Status icon={<Truck className="size-4" strokeWidth={1.75} />} done={shipping.isFree}>
          {shipping.isFree
            ? copy.shipping.unlockedShort
            : emphasise(copy.shipping.away, formatMoney(shipping.remainingForFree))}
        </Status>
        <div
          role="progressbar"
          aria-label={copy.shipping.meterLabel}
          aria-valuemin={0}
          aria-valuemax={target / 100}
          aria-valuenow={(shipping.isFree ? target : reached) / 100}
          aria-valuetext={copy.shipping.valueText(
            formatMoney(shipping.isFree ? shipping.basis : reached),
            formatMoneyShort(target),
          )}
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/10"
        >
          <span className={fillClasses} style={{ transform: `scaleX(${shippingRatio})` }} />
        </div>
      </div>

      <div>
        <Status icon={<Gift className="size-4" strokeWidth={1.75} />} done={freePouch.eligible}>
          {freePouch.eligible ? copy.pouch.unlockedShort : copy.pouch.away(freePouch.sticksNeeded)}
        </Status>
        <div
          role="progressbar"
          aria-label={copy.pouch.meterLabel}
          aria-valuemin={0}
          aria-valuemax={steps}
          aria-valuenow={filled}
          aria-valuetext={copy.pouch.step(filled, steps)}
          className="mt-2.5 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: steps }, (_, index) => (
            <span key={index} className="h-1.5 overflow-hidden rounded-full bg-ink/10">
              <span className={fillClasses} style={{ transform: `scaleX(${index < filled ? 1 : 0})` }} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
