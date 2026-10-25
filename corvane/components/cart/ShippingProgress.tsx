import { Check, Gift, Mail, Truck } from "lucide-react";
import type { ReactNode } from "react";

import { cartCopy } from "@/content/cart";
import { offers } from "@/content/offers";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyShort } from "@/lib/money";
import type { PricingSummary } from "@/lib/types";

/**
 * Progress towards the two order goals (docs/PLAN.md §10), read only from
 * PricingSummary, kept quiet so the lines stay the focus: no card, hairline
 * bars, a rule underneath.
 * 1. euros towards free shipping (shipping.basis against shipping.freeFrom,
 *    the same basis as the pricing rule, D14);
 * 2. three steps towards the free Travel Pouch (one per order, D11).
 * Each open goal is a status line plus a role="progressbar" meter with a
 * value text. A goal that is met collapses to one plain line without a
 * meter; when both are met, the block is a single line. Fills animate only
 * with motion allowed. Gift-card-only carts show a one-line note instead.
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

function Status({ icon, done, children }: { icon?: ReactNode; done: boolean; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-[13px] leading-snug text-ink">
      <span
        aria-hidden="true"
        className={cn("mt-px inline-flex size-[18px] shrink-0 items-center justify-center", done ? "text-kelp" : "text-ink-soft")}
      >
        {done ? <Check className="size-4" strokeWidth={2.25} /> : icon}
      </span>
      <span className="min-w-0 text-balance">{children}</span>
    </p>
  );
}

// Forced colors drops background colours, so track and fill opt out there and use system colours.
const trackClasses =
  "h-0.5 overflow-hidden rounded-full bg-ink/10 forced-color-adjust-none forced-colors:bg-[GrayText]";

const fillClasses =
  "block h-full origin-left rounded-full bg-kelp forced-color-adjust-none forced-colors:bg-[CanvasText] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out";

export function ShippingProgress({ pricing, className }: ShippingProgressProps) {
  const copy = cartCopy.progress;
  const { shipping, freePouch, stickCount } = pricing;
  const frame = cn("border-b border-line pb-5", className);

  if (!shipping.requiresShipping) {
    return (
      <section aria-label={copy.label} className={frame}>
        <Status icon={<Mail className="size-4" strokeWidth={1.75} />} done={false}>
          {copy.shipping.notNeeded}
        </Status>
      </section>
    );
  }

  if (shipping.isFree && freePouch.eligible) {
    return (
      <section aria-label={copy.label} className={frame}>
        <Status done>{copy.bothUnlocked}</Status>
      </section>
    );
  }

  const target = Math.max(1, shipping.freeFrom);
  const reached = Math.min(shipping.basis, target);

  // One step per stick up to the threshold (3). Only the step count comes from config; progress comes from the summary.
  const steps = Math.max(1, offers.freePouch.minSticks);
  const filled = Math.min(stickCount, steps);

  return (
    <section aria-label={copy.label} className={cn("space-y-4", frame)}>
      {shipping.isFree ? (
        <Status done>{copy.shipping.unlocked}</Status>
      ) : (
        <div>
          <Status icon={<Truck className="size-4" strokeWidth={1.75} />} done={false}>
            {emphasise(copy.shipping.away, formatMoney(shipping.remainingForFree))}
          </Status>
          <div
            role="progressbar"
            aria-label={copy.shipping.meterLabel}
            aria-valuemin={0}
            aria-valuemax={target / 100}
            aria-valuenow={reached / 100}
            aria-valuetext={copy.shipping.valueText(formatMoney(reached), formatMoneyShort(target))}
            className={cn("mt-2.5", trackClasses)}
          >
            <span className={fillClasses} style={{ transform: `scaleX(${reached / target})` }} />
          </div>
        </div>
      )}

      {freePouch.eligible ? (
        <Status done>{copy.pouch.unlocked}</Status>
      ) : (
        <div>
          <Status icon={<Gift className="size-4" strokeWidth={1.75} />} done={false}>
            {copy.pouch.away(freePouch.sticksNeeded)}
            <span className="mt-0.5 block text-xs text-ink-soft">{copy.pouch.perOrder}</span>
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
              <span key={index} className={trackClasses}>
                <span className={fillClasses} style={{ transform: `scaleX(${index < filled ? 1 : 0})` }} />
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
