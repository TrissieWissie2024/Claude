import { shipping as defaultShipping } from "@/content/shipping";
import type { CountryCode, ShippingConfig, ShippingCountry } from "@/lib/types";

/**
 * Dispatch day and delivery estimate (docs/PLAN.md §8, D15).
 *
 * Pure: every function takes `now` as an argument and computes wall-clock
 * values in the warehouse time zone (Europe/Amsterdam) via Intl, so it stays
 * correct across daylight saving changes. Dates are ISO strings (YYYY-MM-DD).
 *
 * Deliberately no countdown to the 15:00 cut-off: a timer that restarts every
 * day is fake urgency (brief §2.3). The UI shows fixed text only, e.g.
 * "Order before 15:00, ships today" or "Ships Monday".
 */

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 1 = Monday ... 7 = Sunday. */
  isoWeekday: number;
  /** YYYY-MM-DD in the requested time zone. */
  isoDate: string;
}

export interface DispatchInfo {
  /** Day the order leaves the warehouse (YYYY-MM-DD, Amsterdam). */
  dispatchDate: string;
  /** True when an order placed at `now` ships the same day. */
  shipsToday: boolean;
}

export interface DeliveryEstimate {
  country: CountryCode;
  dispatchDate: string;
  shipsToday: boolean;
  /** Earliest and latest delivery day (YYYY-MM-DD). Equal when transit is fixed. */
  earliest: string;
  latest: string;
}

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ------------------------------------------------------------------ */
/* Calendar helpers on ISO dates                                       */
/* ------------------------------------------------------------------ */

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function parseIsoDate(isoDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Invalid ISO date: ${isoDate}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Days since the Unix epoch for a calendar date (no time zone involved). */
function toDayNumber(isoDate: string): number {
  const { year, month, day } = parseIsoDate(isoDate);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

function fromDayNumber(dayNumber: number): string {
  const date = new Date(dayNumber * 86_400_000);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Calendar arithmetic on an ISO date. */
export function addCalendarDays(isoDate: string, days: number): string {
  return fromDayNumber(toDayNumber(isoDate) + days);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** ISO weekday of a calendar date: 1 = Monday ... 7 = Sunday. */
export function isoWeekdayOf(isoDate: string): number {
  const weekday = new Date(toDayNumber(isoDate) * 86_400_000).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

/* ------------------------------------------------------------------ */
/* Time zones                                                          */
/* ------------------------------------------------------------------ */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock parts of an instant in a time zone. */
export function getZonedParts(now: Date, timeZone: string = defaultShipping.timeZone): ZonedParts {
  const values: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(now)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  const { year, month, day } = values;
  // Some engines report midnight as 24 even with h23.
  const hour = values.hour === 24 ? 0 : values.hour;
  const isoDate = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
  return {
    year,
    month,
    day,
    hour,
    minute: values.minute,
    second: values.second,
    isoWeekday: isoWeekdayOf(isoDate),
    isoDate,
  };
}

/** Offset of the time zone from UTC at an instant, in milliseconds. */
function offsetAt(instantMs: number, timeZone: string): number {
  const parts = getZonedParts(new Date(instantMs), timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

/**
 * The UTC instant of a wall-clock time on a date in a time zone, correct across
 * DST (e.g. 15:00 Amsterdam is 14:00Z in winter and 13:00Z in summer).
 */
export function zonedDateTimeToInstant(
  isoDate: string,
  hour: number,
  minute: number,
  timeZone: string = defaultShipping.timeZone,
): Date {
  const { year, month, day } = parseIsoDate(isoDate);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = wallClockAsUtc - offsetAt(wallClockAsUtc, timeZone);
  const offset = offsetAt(firstGuess, timeZone);
  return new Date(wallClockAsUtc - offset);
}

/* ------------------------------------------------------------------ */
/* Dispatch and delivery days                                          */
/* ------------------------------------------------------------------ */

function findCountry(country: CountryCode | undefined, config: ShippingConfig): ShippingCountry {
  const match =
    config.countries.find((candidate) => candidate.code === country) ??
    config.countries.find((candidate) => candidate.code === config.defaultCountry) ??
    config.countries[0];
  if (!match) throw new Error("Shipping config has no countries.");
  return match;
}

/** The warehouse ships on this date: a dispatch weekday and not a Dutch holiday. */
export function isDispatchDay(isoDate: string, config: ShippingConfig = defaultShipping): boolean {
  return (
    config.dispatchWeekdays.includes(isoWeekdayOf(isoDate)) &&
    !config.holidays.some((holiday) => holiday.date === isoDate)
  );
}

/** First dispatch day strictly after `isoDate`. */
export function nextDispatchDay(isoDate: string, config: ShippingConfig = defaultShipping): string {
  let candidate = addCalendarDays(isoDate, 1);
  // Bounded so a broken config cannot loop forever.
  for (let step = 0; step < 366 && !isDispatchDay(candidate, config); step += 1) {
    candidate = addCalendarDays(candidate, 1);
  }
  return candidate;
}

/** Parcels are delivered in `country` on this date: Monday to Friday, not a local holiday. */
export function isDeliveryDay(
  isoDate: string,
  country: CountryCode,
  config: ShippingConfig = defaultShipping,
): boolean {
  const weekday = isoWeekdayOf(isoDate);
  if (weekday > 5) return false;
  return !findCountry(country, config).deliveryHolidays.some((holiday) => holiday.date === isoDate);
}

/** The date `days` delivery days after `isoDate` (0 returns `isoDate`). */
export function addDeliveryDays(
  isoDate: string,
  days: number,
  country: CountryCode,
  config: ShippingConfig = defaultShipping,
): string {
  let date = isoDate;
  for (let counted = 0; counted < days; counted += 1) {
    date = addCalendarDays(date, 1);
    for (let step = 0; step < 366 && !isDeliveryDay(date, country, config); step += 1) {
      date = addCalendarDays(date, 1);
    }
  }
  return date;
}

/** The cut-off as text, e.g. "15:00". Static copy only, never a countdown. */
export function getCutoffLabel(config: ShippingConfig = defaultShipping): string {
  return `${pad(config.cutoff.hour)}:${pad(config.cutoff.minute)}`;
}

/**
 * When an order placed at `now` ships: today if it is a dispatch day and the
 * Amsterdam time is before the cut-off (15:00), otherwise the next dispatch day.
 */
export function getDispatchInfo(now: Date, config: ShippingConfig = defaultShipping): DispatchInfo {
  const local = getZonedParts(now, config.timeZone);
  const minutes = local.hour * 60 + local.minute;
  const cutoff = config.cutoff.hour * 60 + config.cutoff.minute;
  const shipsToday = isDispatchDay(local.isoDate, config) && minutes < cutoff;
  return {
    dispatchDate: shipsToday ? local.isoDate : nextDispatchDay(local.isoDate, config),
    shipsToday,
  };
}

/** Dispatch day plus the country's transit time in its delivery days (NL 1, BE 1 to 2). */
export function getDeliveryEstimate(
  now: Date,
  country: CountryCode,
  config: ShippingConfig = defaultShipping,
): DeliveryEstimate {
  const { dispatchDate, shipsToday } = getDispatchInfo(now, config);
  const entry = findCountry(country, config);
  return {
    country: entry.code,
    dispatchDate,
    shipsToday,
    earliest: addDeliveryDays(dispatchDate, entry.transitDays.min, entry.code, config),
    latest: addDeliveryDays(dispatchDate, entry.transitDays.max, entry.code, config),
  };
}

/* ------------------------------------------------------------------ */
/* Labels (en-GB style, fixed names so server and browser agree)       */
/* ------------------------------------------------------------------ */

/** "Mon 2 Nov". */
export function formatDate(isoDate: string): string {
  const { month, day } = parseIsoDate(isoDate);
  return `${WEEKDAYS_SHORT[isoWeekdayOf(isoDate) - 1]} ${day} ${MONTHS_SHORT[month - 1]}`;
}

/**
 * Relative label for a date as seen from `now` in Amsterdam: "today",
 * "tomorrow", a weekday name ("Monday") within the next 6 days, otherwise
 * "Mon 2 Nov". Lower-case "today"/"tomorrow" so it reads inside a sentence.
 */
export function formatDayLabel(
  isoDate: string,
  now: Date,
  config: ShippingConfig = defaultShipping,
): string {
  const today = getZonedParts(now, config.timeZone).isoDate;
  const diff = daysBetween(today, isoDate);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1 && diff <= 6) return WEEKDAYS_LONG[isoWeekdayOf(isoDate) - 1];
  return formatDate(isoDate);
}
