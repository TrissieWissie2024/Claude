"use client";

import { Package, Truck } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Container } from "@/components/ui/Container";
import { Flag } from "@/components/ui/Flag";
import { home } from "@/content/home";
import { shipping } from "@/content/shipping";
import { cn } from "@/lib/cn";
import { formatDayLabel, getDeliveryEstimate } from "@/lib/delivery";
import { useNow } from "@/lib/hooks/useNow";
import { formatMoneyShort } from "@/lib/money";
import type { CountryCode, ShippingCountry } from "@/lib/types";

/**
 * Delivery bar under the hero (brief §6.4, docs/PLAN.md §8): dispatch day,
 * estimated delivery in the selected country (with its flag), the
 * free-shipping threshold from content/shipping.ts and a small NL/BE switch
 * that sets the cart country (useCart().setCountry).
 *
 * Fixed text only, never a countdown to the 15:00 cut-off (brief §2.3):
 * "Order before 15:00, ships today" or "Ships Monday", from lib/delivery.ts.
 * Before mount (`useNow` is null on the server and during hydration) the same
 * three lines show text that is true on every day, so nothing shifts. The
 * clock ticks once a minute, enough to flip at the cut-off.
 *
 * Phones and tablets: three stacked lines with an icon column, the switch at
 * the end of the last line. From lg: one row with hairline dividers.
 */

const copy = home.deliveryBar;

function getCountry(code: CountryCode): ShippingCountry {
  return shipping.countries.find((entry) => entry.code === code) ?? shipping.countries[0];
}

interface DeliveryLines {
  dispatch: string;
  estimate: string;
  freeShipping: string;
}

/** The three lines for a moment and a country; `now` null gives the always-true fallback. */
function getDeliveryLines(now: Date | null, country: ShippingCountry): DeliveryLines {
  const freeShipping = copy.freeShipping(formatMoneyShort(country.freeFrom));
  if (!now) {
    return {
      dispatch: copy.fallbackDispatch,
      estimate: copy.fallbackEstimate(country.transitDays.min, country.transitDays.max),
      freeShipping,
    };
  }
  const estimate = getDeliveryEstimate(now, country.code);
  const earliest = formatDayLabel(estimate.earliest, now);
  return {
    dispatch: estimate.shipsToday ? copy.shipsToday : copy.shipsOn(formatDayLabel(estimate.dispatchDate, now)),
    estimate:
      estimate.earliest === estimate.latest
        ? copy.estimate(earliest)
        : copy.estimateRange(earliest, formatDayLabel(estimate.latest, now)),
    freeShipping,
  };
}

export interface DeliveryBarProps {
  className?: string;
}

export function DeliveryBar({ className }: DeliveryBarProps) {
  const { country: countryCode, setCountry } = useCart();
  const now = useNow(60_000);
  const [announcement, setAnnouncement] = useState("");
  const headingId = `${copy.id}-heading`;

  const country = getCountry(countryCode);
  const lines = getDeliveryLines(now, country);

  const handleCountryChange = (code: CountryCode) => {
    setCountry(code);
    const next = getCountry(code);
    // Reading the clock in an event handler is fine (never during render).
    setAnnouncement(copy.countryChanged(next.name, getDeliveryLines(new Date(), next).estimate));
  };

  return (
    <section id={copy.id} aria-labelledby={headingId} className={cn("border-b border-line bg-fog", className)}>
      <h2 id={headingId} className="sr-only">
        {copy.label}
      </h2>
      <Container className="flex min-h-[7.25rem] flex-col justify-center gap-y-1.5 py-4 lg:min-h-16 lg:flex-row lg:items-center lg:gap-x-6 lg:py-3">
        <BarItem icon={<Package aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />} strong>
          {lines.dispatch}
        </BarItem>
        <BarItem icon={<Flag country={country.code} decorative />} divider>
          {lines.estimate}
        </BarItem>
        <div className="flex items-center justify-between gap-4 lg:flex-1">
          <BarItem icon={<Truck aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />} divider>
            {lines.freeShipping}
          </BarItem>
          <CountrySwitch value={country.code} onChange={handleCountryChange} />
        </div>
      </Container>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}

function BarItem({
  icon,
  strong = false,
  divider = false,
  children,
}: {
  icon: ReactNode;
  strong?: boolean;
  /** Hairline before the item in the one-row layout (lg). */
  divider?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "tabular flex items-start gap-3 text-sm leading-5",
        strong ? "font-semibold text-ink" : "text-ink-soft",
        divider && "lg:border-l lg:border-line lg:pl-6",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-ink">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

/** Segmented NL/BE control: native radios, so arrow keys and screen readers work as expected. */
function CountrySwitch({ value, onChange }: { value: CountryCode; onChange: (code: CountryCode) => void }) {
  const name = useId();
  return (
    <fieldset className="shrink-0">
      <legend className="sr-only">{copy.countryLabel}</legend>
      <div className="flex gap-0.5 rounded-full bg-ink/[0.06] p-0.5">
        {shipping.countries.map((entry) => {
          const selected = entry.code === value;
          return (
            <label
              key={entry.code}
              className={cn(
                "flex h-7 min-w-11 cursor-pointer items-center justify-center rounded-full px-2.5 text-[0.8125rem] font-semibold tracking-[0.02em] transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                selected
                  ? "bg-fog text-ink shadow-[0_1px_2px_rgb(16_20_24/0.14)] ring-1 ring-line"
                  : "text-ink-soft hover:text-ink",
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
