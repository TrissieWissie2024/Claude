"use client";

import { getZonedParts } from "@/lib/delivery";
import { useNow } from "@/lib/hooks/useNow";

/**
 * The dispatch holidays on /shipping-returns, by year. The static HTML lists
 * every date in content/shipping.ts (the clock is never read while
 * rendering); after mount, dates before today (Amsterdam time) drop out, and
 * so does a year with none left, so the list never opens with days that have
 * passed. The parent keeps the heading and intro.
 */

export interface HolidayYear {
  year: string;
  days: { iso: string; date: string; name: string }[];
}

/** Re-check once an hour, so a page left open past midnight stays right. */
const CLOCK_INTERVAL_MS = 60 * 60 * 1000;

export function UpcomingHolidays({ years }: { years: HolidayYear[] }) {
  const now = useNow(CLOCK_INTERVAL_MS);
  const today = now ? getZonedParts(now).isoDate : null;
  // ISO dates compare as strings.
  const shown = today
    ? years
        .map((year) => ({ ...year, days: year.days.filter((day) => day.iso >= today) }))
        .filter((year) => year.days.length > 0)
    : years;

  if (shown.length === 0) return null;

  return (
    <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:gap-8">
      {shown.map((year) => (
        <div key={year.year}>
          <p id={`holidays-${year.year}`} className="label-caps tabular text-ink-soft">
            {year.year}
          </p>
          <ul aria-labelledby={`holidays-${year.year}`} className="mt-2 divide-y divide-ink/10">
            {year.days.map((day) => (
              // Phones: date and name on one line. sm+ (two narrow year columns): name under the date, so every row has the same shape.
              <li
                key={day.iso}
                className="flex flex-wrap items-baseline justify-between gap-x-4 py-2 text-[0.9375rem] sm:flex-col sm:items-start sm:gap-0.5"
              >
                <time dateTime={day.iso} className="tabular text-ink">
                  {day.date}
                </time>
                <span className="text-ink-soft sm:text-sm">{day.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
