import { describe, expect, it, vi } from "vitest";
import { shipping } from "@/content/shipping";
import {
  addCalendarDays,
  addDeliveryDays,
  daysBetween,
  formatDate,
  formatDayLabel,
  getCutoffLabel,
  getDeliveryEstimate,
  getDispatchInfo,
  getZonedParts,
  isDeliveryDay,
  isDispatchDay,
  isoWeekdayOf,
  nextDispatchDay,
  zonedDateTimeToInstant,
} from "@/lib/delivery";
import type { CountryCode, ShippingConfig } from "@/lib/types";

/*
 * All inputs are UTC instants chosen to map to the intended Amsterdam
 * wall-clock time: UTC+2 (CEST) until 2026-10-25 01:00Z, UTC+1 (CET) until
 * 2027-03-28 01:00Z, then UTC+2 again.
 */

const dispatchDate = (iso: string) => getDispatchInfo(new Date(iso)).dispatchDate;

describe("calendar helpers", () => {
  it("computes weekdays and date arithmetic", () => {
    expect(isoWeekdayOf("2026-10-23")).toBe(5);
    expect(isoWeekdayOf("2026-10-25")).toBe(7);
    expect(isoWeekdayOf("2026-11-02")).toBe(1);
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addCalendarDays("2027-03-27", 2)).toBe("2027-03-29");
    expect(daysBetween("2026-10-25", "2026-11-01")).toBe(7);
    expect(daysBetween("2026-11-01", "2026-10-25")).toBe(-7);
  });
});

describe("getZonedParts", () => {
  it("reads Amsterdam wall-clock time on both sides of the October DST change", () => {
    // 2026-10-25: 03:00 CEST becomes 02:00 CET, so 02:30 happens twice.
    expect(getZonedParts(new Date("2026-10-25T00:30:00Z"), "Europe/Amsterdam")).toEqual({
      year: 2026,
      month: 10,
      day: 25,
      hour: 2,
      minute: 30,
      second: 0,
      isoWeekday: 7,
      isoDate: "2026-10-25",
    });
    expect(getZonedParts(new Date("2026-10-25T01:30:00Z"), "Europe/Amsterdam")).toMatchObject({ hour: 2, minute: 30 });
    expect(getZonedParts(new Date("2026-10-25T14:00:00Z"), "Europe/Amsterdam")).toMatchObject({ hour: 15 });
  });

  it("reads Amsterdam wall-clock time around the March DST change", () => {
    expect(getZonedParts(new Date("2027-03-28T00:59:00Z"))).toMatchObject({ hour: 1, minute: 59 });
    expect(getZonedParts(new Date("2027-03-28T01:00:00Z"))).toMatchObject({ hour: 3, minute: 0 });
  });

  it("rolls over the date at local midnight, not UTC midnight", () => {
    expect(getZonedParts(new Date("2026-11-06T23:30:00Z"))).toMatchObject({
      isoDate: "2026-11-07",
      hour: 0,
      isoWeekday: 6,
    });
    expect(getZonedParts(new Date("2026-07-01T22:00:00Z"))).toMatchObject({ isoDate: "2026-07-02", hour: 0 });
  });
});

describe("zonedDateTimeToInstant (DST)", () => {
  it("puts the 15:00 cut-off at 14:00Z in winter time and 13:00Z in summer time", () => {
    expect(zonedDateTimeToInstant("2026-10-23", 15, 0).toISOString()).toBe("2026-10-23T13:00:00.000Z");
    expect(zonedDateTimeToInstant("2026-10-25", 15, 0).toISOString()).toBe("2026-10-25T14:00:00.000Z");
    expect(zonedDateTimeToInstant("2027-03-26", 15, 0).toISOString()).toBe("2027-03-26T14:00:00.000Z");
    expect(zonedDateTimeToInstant("2027-03-28", 15, 0).toISOString()).toBe("2027-03-28T13:00:00.000Z");
    expect(zonedDateTimeToInstant("2027-03-29", 15, 0, "Europe/Amsterdam").toISOString()).toBe(
      "2027-03-29T13:00:00.000Z",
    );
  });

  it("round-trips through getZonedParts", () => {
    for (const isoDate of ["2026-10-24", "2026-10-25", "2026-10-26", "2027-03-27", "2027-03-28", "2027-03-29"]) {
      const parts = getZonedParts(zonedDateTimeToInstant(isoDate, 15, 0));
      expect(parts).toMatchObject({ isoDate, hour: 15, minute: 0 });
    }
  });
});

describe("dispatch day", () => {
  it("Friday 14:59 ships today, Friday 15:00 ships Monday", () => {
    // Friday 2026-11-06, winter time.
    expect(getDispatchInfo(new Date("2026-11-06T13:59:59Z"))).toEqual({ dispatchDate: "2026-11-06", shipsToday: true });
    expect(getDispatchInfo(new Date("2026-11-06T14:00:00Z"))).toEqual({ dispatchDate: "2026-11-09", shipsToday: false });
    // Friday 2026-10-23, summer time.
    expect(getDispatchInfo(new Date("2026-10-23T12:59:00Z")).shipsToday).toBe(true);
    expect(getDispatchInfo(new Date("2026-10-23T13:00:00Z"))).toEqual({ dispatchDate: "2026-10-26", shipsToday: false });
  });

  it("weekend orders ship Monday", () => {
    expect(dispatchDate("2026-10-31T09:00:00Z")).toBe("2026-11-02"); // Saturday
    expect(dispatchDate("2026-11-01T11:00:00Z")).toBe("2026-11-02"); // Sunday, before 15:00
    expect(getDispatchInfo(new Date("2026-11-01T11:00:00Z")).shipsToday).toBe(false);
  });

  it("the DST weekend itself: Sunday 2026-10-25 ships Monday, Monday cut-off is 14:00Z", () => {
    expect(dispatchDate("2026-10-25T10:00:00Z")).toBe("2026-10-26");
    expect(getDispatchInfo(new Date("2026-10-26T13:59:00Z"))).toEqual({ dispatchDate: "2026-10-26", shipsToday: true });
    expect(getDispatchInfo(new Date("2026-10-26T14:00:00Z"))).toEqual({ dispatchDate: "2026-10-27", shipsToday: false });
  });

  it("around 2027-03-28: Friday cut-off at 14:00Z, Easter Monday skipped", () => {
    expect(getDispatchInfo(new Date("2027-03-26T13:59:00Z")).shipsToday).toBe(true);
    expect(dispatchDate("2027-03-26T14:00:00Z")).toBe("2027-03-30");
    expect(dispatchDate("2027-03-28T10:00:00Z")).toBe("2027-03-30");
  });

  it("Christmas Day 2026 (Friday) ships Monday 28 December", () => {
    expect(isDispatchDay("2026-12-25")).toBe(false);
    expect(dispatchDate("2026-12-25T09:00:00Z")).toBe("2026-12-28");
  });

  it("Thursday 24 December 2026 after the cut-off ships Monday 28 December", () => {
    expect(getDispatchInfo(new Date("2026-12-24T13:00:00Z"))).toEqual({ dispatchDate: "2026-12-24", shipsToday: true });
    expect(dispatchDate("2026-12-24T14:30:00Z")).toBe("2026-12-28");
    expect(nextDispatchDay("2026-12-24")).toBe("2026-12-28");
  });

  it("Easter Monday 2027-03-29 ships Tuesday", () => {
    expect(getDispatchInfo(new Date("2027-03-29T08:00:00Z"))).toEqual({ dispatchDate: "2027-03-30", shipsToday: false });
  });

  it("King's Day 2027-04-27 does not ship", () => {
    expect(isDispatchDay("2027-04-27")).toBe(false);
    expect(dispatchDate("2027-04-27T08:00:00Z")).toBe("2027-04-28");
    expect(dispatchDate("2027-04-26T13:00:00Z")).toBe("2027-04-28"); // Monday 15:00 CEST
  });

  it("honours an injected config", () => {
    const config: ShippingConfig = {
      ...shipping,
      cutoff: { hour: 12, minute: 30 },
      holidays: [...shipping.holidays, { date: "2026-11-09", name: "Test closure" }],
    };
    expect(getDispatchInfo(new Date("2026-11-06T11:29:00Z"), config).shipsToday).toBe(true);
    expect(getDispatchInfo(new Date("2026-11-06T11:30:00Z"), config).dispatchDate).toBe("2026-11-10");
    expect(getCutoffLabel(config)).toBe("12:30");
  });

  it("exposes the cut-off as fixed text and no countdown fields", () => {
    expect(getCutoffLabel()).toBe("15:00");
    expect(Object.keys(getDispatchInfo(new Date("2026-11-06T10:00:00Z"))).sort()).toEqual(["dispatchDate", "shipsToday"]);
  });
});

describe("delivery days", () => {
  it("knows delivery days per country", () => {
    expect(isDeliveryDay("2026-11-11", "BE")).toBe(false); // Armistice Day
    expect(isDeliveryDay("2026-11-11", "NL")).toBe(true);
    expect(isDeliveryDay("2026-11-07", "NL")).toBe(false); // Saturday
    expect(isDeliveryDay("2027-04-27", "NL")).toBe(false); // King's Day
    expect(isDeliveryDay("2027-04-27", "BE")).toBe(true);
  });

  it("adds delivery days, skipping weekends and holidays", () => {
    expect(addDeliveryDays("2026-11-02", 0, "NL")).toBe("2026-11-02");
    expect(addDeliveryDays("2026-11-02", 1, "NL")).toBe("2026-11-03");
    expect(addDeliveryDays("2026-11-06", 1, "NL")).toBe("2026-11-09");
    expect(addDeliveryDays("2026-11-10", 1, "BE")).toBe("2026-11-12");
    expect(addDeliveryDays("2026-11-10", 2, "BE")).toBe("2026-11-13");
  });

  it("NL delivers the next working day", () => {
    expect(getDeliveryEstimate(new Date("2026-11-02T09:00:00Z"), "NL")).toEqual({
      country: "NL",
      dispatchDate: "2026-11-02",
      shipsToday: true,
      earliest: "2026-11-03",
      latest: "2026-11-03",
    });
    // Friday after the cut-off: ships Monday, arrives Tuesday.
    expect(getDeliveryEstimate(new Date("2026-11-06T14:00:00Z"), "NL")).toMatchObject({
      dispatchDate: "2026-11-09",
      earliest: "2026-11-10",
      latest: "2026-11-10",
    });
    // Friday before the cut-off: arrives Monday.
    expect(getDeliveryEstimate(new Date("2026-11-06T09:00:00Z"), "NL").earliest).toBe("2026-11-09");
  });

  it("NL delivery skips Christmas", () => {
    expect(getDeliveryEstimate(new Date("2026-12-24T09:00:00Z"), "NL")).toMatchObject({
      dispatchDate: "2026-12-24",
      earliest: "2026-12-28",
      latest: "2026-12-28",
    });
  });

  it("BE delivers in 1 to 2 working days, skipping Belgian holidays", () => {
    // Dispatch Tuesday 10 Nov 2026; 11 Nov is Armistice Day in Belgium.
    expect(getDeliveryEstimate(new Date("2026-11-10T09:00:00Z"), "BE")).toEqual({
      country: "BE",
      dispatchDate: "2026-11-10",
      shipsToday: true,
      earliest: "2026-11-12",
      latest: "2026-11-13",
    });
    expect(getDeliveryEstimate(new Date("2026-11-10T09:00:00Z"), "NL").earliest).toBe("2026-11-11");
  });
});

describe("labels", () => {
  it("formats dates as 'Mon 2 Nov'", () => {
    expect(formatDate("2026-11-02")).toBe("Mon 2 Nov");
    expect(formatDate("2026-12-28")).toBe("Mon 28 Dec");
    expect(formatDate("2027-09-06")).toBe("Mon 6 Sep");
  });

  it("formats relative day labels from Amsterdam's today", () => {
    const now = new Date("2026-11-06T09:00:00Z"); // Friday 10:00
    expect(formatDayLabel("2026-11-06", now)).toBe("today");
    expect(formatDayLabel("2026-11-07", now)).toBe("tomorrow");
    expect(formatDayLabel("2026-11-09", now)).toBe("Monday");
    expect(formatDayLabel("2026-11-12", now)).toBe("Thursday");
    expect(formatDayLabel("2026-11-13", now)).toBe("Fri 13 Nov");
    expect(formatDayLabel("2026-11-05", now)).toBe("Thu 5 Nov");
  });

  it("uses the Amsterdam date just after local midnight", () => {
    // 00:30 on Saturday 7 Nov in Amsterdam, still Friday in UTC.
    expect(formatDayLabel("2026-11-07", new Date("2026-11-06T23:30:00Z"))).toBe("today");
  });

  it("labels the dispatch day of a Friday-afternoon order as Monday", () => {
    const now = new Date("2026-11-06T14:30:00Z");
    expect(formatDayLabel(getDispatchInfo(now).dispatchDate, now)).toBe("Monday");
  });
});

/* ------------------------------------------------------------------ */
/* Edge cases and defensive branches (phase 9 coverage audit)          */
/* ------------------------------------------------------------------ */

describe("year boundary: 31 December 2026 to 4 January 2027", () => {
  it("knows New Year's Day 2027 (a Friday) is not a dispatch or delivery day", () => {
    expect(isoWeekdayOf("2027-01-01")).toBe(5);
    expect(isDispatchDay("2027-01-01")).toBe(false);
    expect(isDeliveryDay("2027-01-01", "NL")).toBe(false);
    expect(isDeliveryDay("2027-01-01", "BE")).toBe(false);
    expect(nextDispatchDay("2026-12-31")).toBe("2027-01-04");
    expect(addCalendarDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(daysBetween("2026-12-31", "2027-01-04")).toBe(4);
  });

  it("Thursday 31 December 14:59 ships today and arrives Monday 4 January", () => {
    const now = new Date("2026-12-31T13:59:59Z"); // 14:59:59 CET
    expect(getDeliveryEstimate(now, "NL")).toEqual({
      country: "NL",
      dispatchDate: "2026-12-31",
      shipsToday: true,
      earliest: "2027-01-04",
      latest: "2027-01-04",
    });
    expect(getDeliveryEstimate(now, "BE")).toMatchObject({ earliest: "2027-01-04", latest: "2027-01-05" });
  });

  it("Thursday 31 December 15:00 ships Monday 4 January, past the holiday and the weekend", () => {
    const now = new Date("2026-12-31T14:00:00Z"); // 15:00 CET
    expect(getDeliveryEstimate(now, "NL")).toEqual({
      country: "NL",
      dispatchDate: "2027-01-04",
      shipsToday: false,
      earliest: "2027-01-05",
      latest: "2027-01-05",
    });
    expect(getDeliveryEstimate(now, "BE")).toMatchObject({
      dispatchDate: "2027-01-04",
      earliest: "2027-01-05",
      latest: "2027-01-06",
    });
    expect(formatDayLabel("2027-01-04", now)).toBe("Monday");
    expect(formatDayLabel("2027-01-06", now)).toBe("Wednesday");
    expect(formatDayLabel("2027-01-07", now)).toBe("Thu 7 Jan");
    expect(formatDate("2027-01-04")).toBe("Mon 4 Jan");
  });

  it("switches to 2027 at Amsterdam midnight, an hour before UTC", () => {
    const now = new Date("2026-12-31T23:30:00Z"); // 00:30 CET on 1 January
    expect(getZonedParts(now)).toMatchObject({ year: 2027, month: 1, day: 1, hour: 0, isoWeekday: 5, isoDate: "2027-01-01" });
    expect(getDispatchInfo(now)).toEqual({ dispatchDate: "2027-01-04", shipsToday: false });
    expect(formatDayLabel("2027-01-01", now)).toBe("today");
  });

  it("an order on New Year's Day itself ships Monday", () => {
    expect(getDispatchInfo(new Date("2027-01-01T09:00:00Z"))).toEqual({ dispatchDate: "2027-01-04", shipsToday: false });
  });
});

describe("Belgian holidays (D15)", () => {
  const beCountry = shipping.countries.find((country) => country.code === "BE");

  it("never delivers in Belgium on a listed Belgian holiday", () => {
    expect(beCountry?.deliveryHolidays.length).toBeGreaterThan(0);
    for (const holiday of beCountry?.deliveryHolidays ?? []) {
      expect(isDeliveryDay(holiday.date, "BE"), `${holiday.date} ${holiday.name}`).toBe(false);
    }
  });

  it("delivers in NL on Belgian-only holidays and in BE on Dutch-only holidays", () => {
    expect(isDeliveryDay("2026-05-01", "BE")).toBe(false); // Labour Day, Friday
    expect(isDeliveryDay("2026-05-01", "NL")).toBe(true);
    expect(isDeliveryDay("2027-07-21", "BE")).toBe(false); // National Day, Wednesday
    expect(isDeliveryDay("2027-07-21", "NL")).toBe(true);
    expect(isDeliveryDay("2027-11-01", "BE")).toBe(false); // All Saints' Day, Monday
    expect(isDeliveryDay("2027-11-01", "NL")).toBe(true);
    expect(isDeliveryDay("2027-11-11", "BE")).toBe(false); // Armistice Day, Thursday
    expect(isDeliveryDay("2026-04-27", "BE")).toBe(true); // King's Day is Dutch only
    expect(isDeliveryDay("2026-12-26", "BE")).toBe(false); // Saturday anyway
  });

  it("Labour Day 2026: a Thursday order reaches Belgium on Monday or Tuesday, NL on Friday", () => {
    const now = new Date("2026-04-30T08:00:00Z"); // Thursday 10:00 CEST
    expect(getDeliveryEstimate(now, "BE")).toEqual({
      country: "BE",
      dispatchDate: "2026-04-30",
      shipsToday: true,
      earliest: "2026-05-04",
      latest: "2026-05-05",
    });
    expect(getDeliveryEstimate(now, "NL")).toMatchObject({ earliest: "2026-05-01", latest: "2026-05-01" });
  });

  it("National Day 2027: a Tuesday order skips Wednesday 21 July in Belgium only", () => {
    const now = new Date("2027-07-20T08:00:00Z");
    expect(getDeliveryEstimate(now, "BE")).toMatchObject({ earliest: "2027-07-22", latest: "2027-07-23" });
    expect(getDeliveryEstimate(now, "NL").earliest).toBe("2027-07-21");
  });

  it("All Saints' Day 2027 (Monday, the day after the DST change)", () => {
    // Friday 29 October 10:00 CEST.
    expect(getDeliveryEstimate(new Date("2027-10-29T08:00:00Z"), "BE")).toMatchObject({
      dispatchDate: "2027-10-29",
      earliest: "2027-11-02",
      latest: "2027-11-03",
    });
    expect(getDeliveryEstimate(new Date("2027-10-29T08:00:00Z"), "NL").earliest).toBe("2027-11-01");
    // Monday 1 November: the warehouse works (not a Dutch holiday), cut-off back at 14:00Z.
    expect(getDispatchInfo(new Date("2027-11-01T13:59:00Z"))).toEqual({ dispatchDate: "2027-11-01", shipsToday: true });
    expect(getDispatchInfo(new Date("2027-11-01T14:00:00Z")).dispatchDate).toBe("2027-11-02");
    expect(getDeliveryEstimate(new Date("2027-11-01T13:59:00Z"), "BE")).toMatchObject({
      earliest: "2027-11-02",
      latest: "2027-11-03",
    });
  });

  it("Christmas 2026 in Belgium: a Christmas Eve order arrives Monday or Tuesday", () => {
    expect(getDeliveryEstimate(new Date("2026-12-24T09:00:00Z"), "BE")).toMatchObject({
      dispatchDate: "2026-12-24",
      earliest: "2026-12-28",
      latest: "2026-12-29",
    });
  });

  it("a Dutch holiday stops dispatch for Belgian orders too (King's Day 2027)", () => {
    // Monday 26 April 15:00 CEST: after the cut-off, and Tuesday is King's Day.
    expect(getDeliveryEstimate(new Date("2027-04-26T13:00:00Z"), "BE")).toEqual({
      country: "BE",
      dispatchDate: "2027-04-28",
      shipsToday: false,
      earliest: "2027-04-29",
      latest: "2027-04-30",
    });
  });
});

describe("DST edge cases", () => {
  it("after the March 2027 change the cut-off is 13:00Z on a normal Tuesday", () => {
    expect(getDispatchInfo(new Date("2027-03-30T12:59:59Z"))).toEqual({ dispatchDate: "2027-03-30", shipsToday: true });
    expect(getDispatchInfo(new Date("2027-03-30T13:00:00Z"))).toEqual({ dispatchDate: "2027-03-31", shipsToday: false });
  });

  it("both 02:30s of the October 2026 DST night are Sunday and ship Monday", () => {
    for (const iso of ["2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z"]) {
      expect(getZonedParts(new Date(iso))).toMatchObject({ isoDate: "2026-10-25", hour: 2, minute: 30, isoWeekday: 7 });
      expect(getDeliveryEstimate(new Date(iso), "NL")).toMatchObject({ dispatchDate: "2026-10-26", earliest: "2026-10-27" });
    }
  });

  it("resolves wall-clock times inside the DST transitions", () => {
    // 02:30 on 25 October 2026 happens twice; either answer must read back as 02:30.
    expect(getZonedParts(zonedDateTimeToInstant("2026-10-25", 2, 30))).toMatchObject({ isoDate: "2026-10-25", hour: 2, minute: 30 });
    // 02:30 on 28 March 2027 does not exist; it moves forward to 03:30 CEST.
    expect(zonedDateTimeToInstant("2027-03-28", 2, 30).toISOString()).toBe("2027-03-28T01:30:00.000Z");
    // Midnight on both DST Sundays.
    expect(zonedDateTimeToInstant("2026-10-25", 0, 0).toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(zonedDateTimeToInstant("2027-03-28", 0, 0).toISOString()).toBe("2027-03-27T23:00:00.000Z");
  });

  it("counts the relative day label by calendar date across the October change", () => {
    // Saturday 24 October 23:30 CEST; the Sunday that follows is 25 hours long.
    const now = new Date("2026-10-24T21:30:00Z");
    expect(formatDayLabel("2026-10-25", now)).toBe("tomorrow");
    expect(formatDayLabel("2026-10-26", now)).toBe("Monday");
  });
});

describe("defensive branches", () => {
  it("rejects dates that are not YYYY-MM-DD", () => {
    expect(() => addCalendarDays("2026-1-1", 1)).toThrow("Invalid ISO date: 2026-1-1");
    expect(() => isoWeekdayOf("1 November 2026")).toThrow("Invalid ISO date");
    expect(() => formatDate("")).toThrow("Invalid ISO date");
    expect(() => daysBetween("2026-11-01", "2026-11-01T00:00:00Z")).toThrow("Invalid ISO date");
  });

  it("treats an hour reported as 24 (some engines at midnight) as 0", () => {
    const original = Intl.DateTimeFormat.prototype.formatToParts;
    const spy = vi
      .spyOn(Intl.DateTimeFormat.prototype, "formatToParts")
      .mockImplementation(function (this: Intl.DateTimeFormat, date?: Date | number) {
        return original
          .call(this, date)
          .map((part) => (part.type === "hour" && part.value === "00" ? { ...part, value: "24" } : part));
      });
    try {
      // 00:30 on Saturday 7 November in Amsterdam.
      expect(getZonedParts(new Date("2026-11-06T23:30:00Z"))).toMatchObject({
        isoDate: "2026-11-07",
        hour: 0,
        minute: 30,
      });
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("falls back to the default country, then to the first country, and throws without countries", () => {
    const now = new Date("2026-11-02T09:00:00Z");
    expect(getDeliveryEstimate(now, "DE" as CountryCode)).toMatchObject({ country: "NL", earliest: "2026-11-03" });

    const onlyBelgium: ShippingConfig = {
      ...shipping,
      countries: shipping.countries.filter((country) => country.code === "BE"),
    };
    expect(getDeliveryEstimate(now, "NL", onlyBelgium)).toMatchObject({ country: "BE", latest: "2026-11-04" });
    // Belgian holidays apply because BE is the only country left.
    expect(isDeliveryDay("2026-11-11", "NL", onlyBelgium)).toBe(false);

    const none: ShippingConfig = { ...shipping, countries: [] };
    expect(() => getDeliveryEstimate(now, "NL", none)).toThrow("Shipping config has no countries.");
    expect(() => isDeliveryDay("2026-11-02", "NL", none)).toThrow("Shipping config has no countries.");
  });

  it("does not loop forever when the config has no dispatch weekdays", () => {
    const closed: ShippingConfig = { ...shipping, dispatchWeekdays: [] };
    expect(isDispatchDay("2026-11-02", closed)).toBe(false);
    expect(nextDispatchDay("2026-11-02", closed)).toBe(addCalendarDays("2026-11-02", 367));
    expect(getDispatchInfo(new Date("2026-11-02T09:00:00Z"), closed).shipsToday).toBe(false);
  });

  it("counts minutes in the cut-off and ignores seconds", () => {
    // 14:59:59.999 CET is still before 15:00.
    expect(getDispatchInfo(new Date("2026-11-06T13:59:59.999Z")).shipsToday).toBe(true);
    const earlyCutoff: ShippingConfig = { ...shipping, cutoff: { hour: 9, minute: 5 } };
    expect(getCutoffLabel(earlyCutoff)).toBe("09:05");
    expect(getDispatchInfo(new Date("2026-11-06T08:04:59Z"), earlyCutoff).shipsToday).toBe(true);
    expect(getDispatchInfo(new Date("2026-11-06T08:05:00Z"), earlyCutoff).shipsToday).toBe(false);
  });
});
