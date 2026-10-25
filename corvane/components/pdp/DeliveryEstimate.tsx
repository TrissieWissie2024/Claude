"use client";

import { Mail, Package } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Flag } from "@/components/ui/Flag";
import { pdp } from "@/content/pdp";
import { shipping } from "@/content/shipping";
import { cn } from "@/lib/cn";
import { formatDate, formatDayLabel, getDeliveryEstimate } from "@/lib/delivery";
import { useNow } from "@/lib/hooks/useNow";
import type { CountryCode, ShippingCountry } from "@/lib/types";

/**
 * Delivery estimate under the add-to-cart button (docs/PLAN.md §8, §9):
 * "Order before 15:00, ships today" (or "Ships Monday") and the estimated
 * delivery date in the cart country, from lib/delivery.ts, with a small NL/BE
 * switch that sets the cart country (useCart().setCountry).
 *
 * Fixed text only, never a countdown to the cut-off (brief §2.3). The clock
 * (useNow, once a minute) is null on the server and during hydration; until
 * then the same lines show text that is true on every day, in the same space.
 *
 * `digital` (the e-gift card): one line, "Delivered by email", no clock.
 */

export interface DeliveryEstimateProps {
  /** Digital product (e-gift card): delivered by email, no estimate. */
  digital?: boolean;
  className?: string;
}

export function DeliveryEstimate({ digital = false, className }: DeliveryEstimateProps) {
  if (digital) {
    return (
      <Panel className={className}>
        <Line icon={<Mail aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />} strong>
          {pdp.delivery.giftCard}
        </Line>
      </Panel>
    );
  }
  return <PhysicalEstimate className={className} />;
}

function getCountry(code: CountryCode): ShippingCountry {
  return shipping.countries.find((entry) => entry.code === code) ?? shipping.countries[0];
}

interface EstimateLines {
  dispatch: string;
  estimate: string;
}

/** The two lines for a moment and a country; `now` null gives the always-true fallback. */
function getLines(now: Date | null, country: ShippingCountry): EstimateLines {
  if (!now) {
    return {
      dispatch: pdp.deliveryFallback.dispatch,
      estimate: pdp.deliveryFallback.estimate(country.transitDays.min, country.transitDays.max),
    };
  }
  const estimate = getDeliveryEstimate(now, country.code);
  return {
    dispatch: estimate.shipsToday
      ? pdp.delivery.shipsToday
      : pdp.delivery.shipsOn(formatDayLabel(estimate.dispatchDate, now)),
    estimate:
      estimate.earliest === estimate.latest
        ? pdp.delivery.estimate(formatDate(estimate.earliest))
        : pdp.delivery.estimateRange(formatRangeStart(estimate.earliest, estimate.latest), formatDate(estimate.latest)),
  };
}

/** "Tue 27" when the range ends in the same month ("Tue 27 to Wed 28 Oct"), else the full "Fri 30 Oct". */
function formatRangeStart(from: string, to: string): string {
  const label = formatDate(from);
  return from.slice(0, 7) === to.slice(0, 7) ? label.replace(/\s+\S+$/, "") : label;
}

function PhysicalEstimate({ className }: { className?: string }) {
  const { country: countryCode, setCountry } = useCart();
  const now = useNow(60_000);
  const [announcement, setAnnouncement] = useState("");
  const country = getCountry(countryCode);
  const lines = getLines(now, country);

  const handleCountryChange = (code: CountryCode) => {
    setCountry(code);
    const next = getCountry(code);
    // Reading the clock in an event handler is fine (never during render).
    setAnnouncement(pdp.deliveryCountryChanged(next.name, getLines(new Date(), next).estimate));
  };

  return (
    <Panel className={className}>
      <h2 className="sr-only">{pdp.sections.delivery}</h2>
      <div className="flex flex-col gap-1.5">
        <Line icon={<Package aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />} strong>
          {lines.dispatch}
        </Line>
        <Line icon={<Flag country={country.code} decorative />}>{lines.estimate}</Line>
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-line pt-3.5">
        <p className="text-xs leading-[1.125rem] text-ink-soft">{pdp.delivery.note}</p>
        <CountrySwitch value={country.code} onChange={handleCountryChange} />
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </Panel>
  );
}

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-card bg-white/55 p-4 ring-1 ring-line ring-inset md:px-5", className)}>{children}</div>;
}

function Line({ icon, strong = false, children }: { icon: ReactNode; strong?: boolean; children: ReactNode }) {
  return (
    <p className={cn("tabular flex items-start gap-3 text-sm leading-5", strong ? "font-semibold text-ink" : "text-ink-soft")}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-ink">{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * Segmented NL/BE control (native radios: arrow keys and screen readers work as expected).
 * The selected option is an ink pill with fog text, not only a colour change (WCAG 1.4.11).
 * Each option draws 28 px but has a 44 px tall hit area (a ::before overlay).
 */
function CountrySwitch({ value, onChange }: { value: CountryCode; onChange: (code: CountryCode) => void }) {
  const name = useId();
  return (
    <fieldset className="shrink-0">
      <legend className="sr-only">{pdp.delivery.countryLabel}</legend>
      <div className="flex gap-0.5 rounded-full bg-ink/[0.06] p-0.5">
        {shipping.countries.map((entry) => {
          const selected = entry.code === value;
          return (
            <label
              key={entry.code}
              className={cn(
                "relative flex h-7 min-w-11 cursor-pointer items-center justify-center rounded-full text-[0.8125rem] font-semibold tracking-[0.02em] transition-colors",
                "before:absolute before:inset-x-0",
                selected ? "before:-inset-y-[9px]" : "before:-inset-y-2",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                // The transparent border is painted in forced colors, so the selection stays visible there.
                selected
                  ? "border border-transparent bg-ink px-2.5 text-fog"
                  : "px-[0.6875rem] text-ink-soft hover:text-ink",
              )}
            >
              <input
                type="radio"
                name={name}
                value={entry.code}
                checked={selected}
                onChange={() => onChange(entry.code)}
                className="sr-only"
              />
              {/* Accessible name "NL (Netherlands)": starts with the visible code (WCAG 2.5.3). */}
              <span>{entry.code}</span>
              <span className="sr-only"> ({entry.name})</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
