const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroWhole = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats integer euro cents, e.g. 2495 -> "€24.95". */
export function formatMoney(cents: number): string {
  return euro.format(cents / 100);
}

/** Formats whole-euro amounts without decimals, e.g. 5000 -> "€50". Falls back to cents when needed. */
export function formatMoneyShort(cents: number): string {
  return cents % 100 === 0 ? euroWhole.format(cents / 100) : formatMoney(cents);
}
