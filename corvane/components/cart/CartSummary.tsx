"use client";

import { useRouter } from "next/navigation";
import { Fragment, useRef, useState, type ReactNode } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { Button } from "@/components/ui/Button";
import { cartCopy } from "@/content/cart";
import { getCartAnalytics, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { PricingSummary } from "@/lib/types";

/**
 * Totals and checkout for the cart drawer (docs/PLAN.md §10, D34).
 *
 * Rows add up on screen: Subtotal (the lines after bundle, subscription and
 * pouch pricing) − code + shipping = Total. Stick lines show their own tile
 * prices (CartLine); when sticks from several lines, or a line with a
 * quantity above one, are priced as sets, a note under Subtotal says by how
 * much ("Sticks grouped into sets: −€14.90"), so the lines trace to the
 * subtotal. "You save" (all savings, PLAN §7 rule 8) is a note next to
 * "Taxes included.", with its parts on a muted line under it when there is
 * more than one ("Sets €14.90 · Travel Pouch €9.95"); it is not part of the sum. A gift-card-only order shows no tax line (VAT on vouchers is a
 * lawyer checkpoint, content/legal.ts).
 *
 * Checkout: fires begin_checkout, POSTs { lines, discountCode, country } to
 * /api/checkout and navigates to the returned checkoutUrl (closing the drawer).
 * The payment icons sit at the end of the drawer body (CartDrawer), not here.
 */

export interface CartSummaryProps {
  /** Show the Checkout button. Default true. */
  showCheckout?: boolean;
  className?: string;
}

interface RowProps {
  label: ReactNode;
  value: ReactNode;
  /** Small text under the label (inside the <dt>, so the list stays valid). */
  note?: ReactNode;
  className?: string;
}

function Row({ label, value, note, className }: RowProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <dt className="min-w-0">
        {label}
        {note ? <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{note}</span> : null}
      </dt>
      <dd className="tabular shrink-0 text-right">{value}</dd>
    </div>
  );
}

/** Saving from pricing sticks as sets across lines: their tile prices minus their grouped totals. */
export function getGroupedSetsSaving(pricing: PricingSummary): number {
  return pricing.lines.reduce(
    (sum, line) => (line.stickCount > 0 ? sum + Math.max(0, line.standaloneTotal - line.total) : sum),
    0,
  );
}

/** The non-zero parts of "You save", in the order of PLAN §7 rule 8. */
function savingsParts(pricing: PricingSummary): string[] {
  const labels = cartCopy.summary.savingsParts;
  const parts: [string, number][] = [
    [labels.bundles, pricing.bundleSavings],
    [labels.subscription, pricing.subscriptionSavings],
    [labels.pouch, pricing.pouchSavings],
    [labels.code, pricing.discount?.amount ?? 0],
  ];
  return parts
    .filter(([, amount]) => amount > 0)
    .map(([label, amount]) => cartCopy.summary.savingsPart(label, formatMoney(amount)));
}

interface CheckoutResponse {
  checkoutUrl?: unknown;
}

export function CartSummary({ showCheckout = true, className }: CartSummaryProps) {
  const { lines, pricing, discountCode, country, hydrated, clearDiscountCode, closeCart } = useCart();
  const { products } = useCatalog();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLButtonElement>(null);

  const copy = cartCopy.summary;
  const { discount, discountError, shipping } = pricing;
  const lineTotal = pricing.subtotal + (discount?.amount ?? 0);
  const codeShown = discount?.code ?? (discountError ? discountCode : null);
  const groupedSaving = getGroupedSetsSaving(pricing);
  const savings = savingsParts(pricing);

  let shippingValue: string;
  if (!shipping.requiresShipping) shippingValue = copy.digitalDelivery;
  else if (shipping.isFree) shippingValue = copy.shippingFree;
  else shippingValue = formatMoney(shipping.amount);

  // The code row disappears with its Remove button; keep focus in the drawer on the next control (WCAG 2.4.3).
  const removeCode = () => {
    clearDiscountCode();
    requestAnimationFrame(() => (checkoutRef.current ?? rootRef.current)?.focus());
  };

  async function checkout() {
    if (status === "loading" || lines.length === 0) return;
    setStatus("loading");
    track("begin_checkout", getCartAnalytics(lines, products, pricing));
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, discountCode, country }),
      });
      const data = (await response.json().catch(() => null)) as CheckoutResponse | null;
      const url = typeof data?.checkoutUrl === "string" ? data.checkoutUrl : null;
      if (!response.ok || !url) throw new Error(`Checkout failed with status ${response.status}`);
      closeCart();
      if (/^https?:\/\//i.test(url)) window.location.assign(url);
      else router.push(url);
    } catch {
      setStatus("error");
    }
  }

  return (
    // Focus target after "Remove" when there is no Checkout button (e.g. an order summary).
    <div ref={rootRef} tabIndex={showCheckout ? undefined : -1} className={className}>
      <dl className="space-y-1 text-sm text-ink md:space-y-1.5">
        <Row
          label={copy.subtotal}
          value={formatMoney(lineTotal)}
          note={groupedSaving > 0 ? copy.groupedSets(formatMoney(groupedSaving)) : undefined}
        />

        {codeShown ? (
          <Row
            label={
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span>{copy.discount(codeShown)}</span>
                <button
                  type="button"
                  aria-label={cartCopy.discount.removeCode(codeShown)}
                  onClick={removeCode}
                  className="rounded text-xs text-ink-soft underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
                >
                  {cartCopy.discount.removeShort}
                </button>
              </span>
            }
            value={discount ? copy.minus(formatMoney(discount.amount)) : null}
            note={discountError ? cartCopy.discount.errors[discountError] : discount?.label}
          />
        ) : null}

        <Row
          label={copy.shipping}
          value={<span className={cn(shipping.isFree && "font-medium text-kelp")}>{shippingValue}</span>}
        />

        <Row
          label={<span className="font-semibold">{copy.total}</span>}
          value={<span className="text-lg font-semibold">{formatMoney(pricing.total)}</span>}
          className="mt-2 border-t border-line pt-2 md:mt-3 md:pt-3"
        />
      </dl>

      {shipping.requiresShipping || pricing.totalSavings > 0 ? (
        <div className="mt-1 text-xs leading-snug text-ink-soft">
          <div className="flex items-baseline justify-between gap-4">
            {shipping.requiresShipping ? <p>{copy.taxesIncluded}</p> : <span />}
            {pricing.totalSavings > 0 ? (
              <p className="tabular font-medium text-kelp">{`${copy.youSave} ${formatMoney(pricing.totalSavings)}`}</p>
            ) : null}
          </div>
          {savings.length > 1 ? (
            <p className="tabular mt-0.5 text-right">
              {savings.map((part, index) => (
                <Fragment key={part}>
                  {index > 0 ? <span aria-hidden="true">{" · "}</span> : null}
                  {/* A comma for screen readers in place of the middle dot. */}
                  {index > 0 ? <span className="sr-only">, </span> : null}
                  <span className="whitespace-nowrap">{part}</span>
                </Fragment>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}

      {showCheckout ? (
        <div className="mt-3">
          <Button
            ref={checkoutRef}
            variant="primary"
            size="md"
            fullWidth
            loading={status === "loading"}
            loadingLabel={cartCopy.checkoutButton.loading}
            disabled={!hydrated || lines.length === 0}
            onClick={checkout}
          >
            {cartCopy.checkoutButton.label}
          </Button>
          {status === "error" ? (
            <p role="alert" className="mt-2 text-center text-[13px] text-ink">
              {cartCopy.checkoutButton.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
