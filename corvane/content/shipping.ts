import type { Holiday, ShippingConfig } from "@/lib/types";

/**
 * Shipping countries, rates and dispatch rules. Amounts in euro cents.
 * Delivery-day logic lives in lib/delivery.ts.
 */

// Dutch public holidays: no dispatch from the warehouse and no delivery in NL.
// Weekend dates are listed for completeness. Extend this list every year.
const nlHolidays: Holiday[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-04-27", name: "King's Day" },
  { date: "2026-05-14", name: "Ascension Day" },
  { date: "2026-05-25", name: "Whit Monday" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-26", name: "Boxing Day" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-03-29", name: "Easter Monday" },
  { date: "2027-04-27", name: "King's Day" },
  { date: "2027-05-06", name: "Ascension Day" },
  { date: "2027-05-17", name: "Whit Monday" },
  { date: "2027-12-25", name: "Christmas Day" },
  { date: "2027-12-26", name: "Boxing Day" },
];

// Belgian public holidays: no delivery in BE.
const beHolidays: Holiday[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-14", name: "Ascension Day" },
  { date: "2026-05-25", name: "Whit Monday" },
  { date: "2026-07-21", name: "National Day" },
  { date: "2026-08-15", name: "Assumption Day" },
  { date: "2026-11-01", name: "All Saints' Day" },
  { date: "2026-11-11", name: "Armistice Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-03-29", name: "Easter Monday" },
  { date: "2027-05-01", name: "Labour Day" },
  { date: "2027-05-06", name: "Ascension Day" },
  { date: "2027-05-17", name: "Whit Monday" },
  { date: "2027-07-21", name: "National Day" },
  { date: "2027-08-15", name: "Assumption Day" },
  { date: "2027-11-01", name: "All Saints' Day" },
  { date: "2027-11-11", name: "Armistice Day" },
  { date: "2027-12-25", name: "Christmas Day" },
];

export const shipping: ShippingConfig = {
  timeZone: "Europe/Amsterdam",
  cutoff: { hour: 15, minute: 0 },
  // Monday to Friday.
  dispatchWeekdays: [1, 2, 3, 4, 5],

  holidays: nlHolidays,

  defaultCountry: "NL",

  countries: [
    {
      code: "NL",
      name: "Netherlands",
      rate: 495,
      freeFrom: 5000,
      transitDays: { min: 1, max: 1 },
      deliveryHolidays: nlHolidays,
    },
    {
      code: "BE",
      name: "Belgium",
      rate: 495,
      freeFrom: 5000,
      transitDays: { min: 1, max: 2 },
      deliveryHolidays: beHolidays,
    },
  ],
};
