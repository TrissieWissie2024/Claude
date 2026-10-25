import { describe, expect, it } from "vitest";
import { addCalendarDays, isoWeekdayOf } from "@/lib/delivery";
import type { Holiday } from "@/lib/types";
import { shipping } from "./shipping";

/*
 * content/shipping.ts against brief §4 and D15. The holiday lists are checked
 * against dates computed from the calendar rules, so a typo in a date (or a
 * missing year when the list is extended) fails here instead of on the site.
 */

/** Easter Sunday (Gregorian), anonymous algorithm (Meeus/Jones/Butcher). */
function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Dutch public holidays as listed in content/shipping.ts (no 5 May outside lustrum years, D15). */
function expectedDutch(year: number): string[] {
  const easter = easterSunday(year);
  const kingsDay = isoWeekdayOf(`${year}-04-27`) === 7 ? `${year}-04-26` : `${year}-04-27`;
  return [
    `${year}-01-01`,
    addCalendarDays(easter, 1),
    kingsDay,
    addCalendarDays(easter, 39),
    addCalendarDays(easter, 50),
    `${year}-12-25`,
    `${year}-12-26`,
  ].sort();
}

/** The ten Belgian statutory public holidays. */
function expectedBelgian(year: number): string[] {
  const easter = easterSunday(year);
  return [
    `${year}-01-01`,
    addCalendarDays(easter, 1),
    `${year}-05-01`,
    addCalendarDays(easter, 39),
    addCalendarDays(easter, 50),
    `${year}-07-21`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
  ].sort();
}

function years(holidays: readonly Holiday[]): number[] {
  return [...new Set(holidays.map((holiday) => Number(holiday.date.slice(0, 4))))].sort();
}

function datesIn(holidays: readonly Holiday[], year: number): string[] {
  return holidays
    .map((holiday) => holiday.date)
    .filter((date) => date.startsWith(`${year}-`))
    .sort();
}

const nl = shipping.countries.find((country) => country.code === "NL");
const be = shipping.countries.find((country) => country.code === "BE");

describe("easterSunday (test helper)", () => {
  it("knows the Easter dates the holiday lists depend on", () => {
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
    expect(easterSunday(2028)).toBe("2028-04-16");
  });
});

describe("holiday lists", () => {
  const lists: [string, readonly Holiday[]][] = [
    ["warehouse (NL)", shipping.holidays],
    ["NL delivery", nl?.deliveryHolidays ?? []],
    ["BE delivery", be?.deliveryHolidays ?? []],
  ];

  it.each(lists)("%s: valid, sorted, unique and named", (_label, holidays) => {
    expect(holidays.length).toBeGreaterThan(0);
    const dates = holidays.map((holiday) => holiday.date);
    for (const holiday of holidays) {
      expect(holiday.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // A real calendar date survives a round trip (2026-02-30 would not).
      expect(addCalendarDays(holiday.date, 0), holiday.date).toBe(holiday.date);
      expect(holiday.name.trim().length, holiday.date).toBeGreaterThan(0);
    }
    expect(dates).toEqual([...dates].sort());
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("covers 2026 and 2027 in every list", () => {
    for (const [, holidays] of lists) {
      expect(years(holidays)).toEqual(expect.arrayContaining([2026, 2027]));
    }
  });

  it("uses the Dutch list for both dispatch and NL delivery", () => {
    expect(nl?.deliveryHolidays).toEqual(shipping.holidays);
  });

  it("lists exactly the Dutch public holidays for every year it covers", () => {
    for (const year of years(shipping.holidays)) {
      expect(datesIn(shipping.holidays, year), `NL ${year}`).toEqual(expectedDutch(year));
    }
  });

  it("lists exactly the Belgian public holidays for every year it covers", () => {
    const holidays = be?.deliveryHolidays ?? [];
    for (const year of years(holidays)) {
      expect(datesIn(holidays, year), `BE ${year}`).toEqual(expectedBelgian(year));
    }
  });

  it("leaves out 5 May, which is a day off only in lustrum years (D15)", () => {
    expect(shipping.holidays.map((holiday) => holiday.date)).not.toContain("2026-05-05");
    expect(shipping.holidays.map((holiday) => holiday.date)).not.toContain("2027-05-05");
  });
});

describe("rates and dispatch rules (brief §4, D15)", () => {
  it("ships from Amsterdam with a 15:00 cut-off on weekdays", () => {
    expect(shipping.timeZone).toBe("Europe/Amsterdam");
    expect(shipping.cutoff).toEqual({ hour: 15, minute: 0 });
    expect([...shipping.dispatchWeekdays].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("starts with NL and BE at €4.95, free from €50, NL as default", () => {
    expect(shipping.countries.map((country) => country.code)).toEqual(["NL", "BE"]);
    expect(shipping.defaultCountry).toBe("NL");
    for (const country of shipping.countries) {
      expect(country.rate, country.code).toBe(495);
      expect(country.freeFrom, country.code).toBe(5000);
      expect(Number.isInteger(country.rate) && Number.isInteger(country.freeFrom)).toBe(true);
      expect(country.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("delivers in 1 working day in NL and 1 to 2 in BE", () => {
    expect(nl?.transitDays).toEqual({ min: 1, max: 1 });
    expect(be?.transitDays).toEqual({ min: 1, max: 2 });
    for (const country of shipping.countries) {
      expect(country.transitDays.min).toBeGreaterThanOrEqual(1);
      expect(country.transitDays.max).toBeGreaterThanOrEqual(country.transitDays.min);
    }
  });
});
