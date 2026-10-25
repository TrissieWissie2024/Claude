"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { PaymentIcons } from "@/components/layout/PaymentIcons";
import { Button } from "@/components/ui/Button";
import { cartCopy } from "@/content/cart";
import { getCartAnalytics, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

/**
 * Totals and checkout for the cart drawer (docs/PLAN.md §10).
 *
 * Rows add up on screen: Subtotal (the lines after bundle, subscription and
 * pouch pricing) − code + shipping = Total. "You save" (all savings, D-rule 8)
 * is a note next to "Taxes included.", not part of the sum.
 *
 * Checkout: fires begin_checkout, POSTs { lines, discountCode, country } to
 * /api/checkout and navigates to the returned checkoutUrl (closing the drawer).
 */

export interface CartSummaryProps {
  /** Show the Checkout button and payment icons. Default true. */
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

interface CheckoutResponse {
  checkoutUrl?: unknown;
}

export function CartSummary({ showCheckout = true, className }: CartSummaryProps) {
  const { lines, pricing, discountCode, country, hydrated, clearDiscountCode, closeCart } = useCart();
  const { products } = useCatalog();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const copy = cartCopy.summary;
  const { discount, discountError, shipping } = pricing;
  const lineTotal = pricing.subtotal + (discount?.amount ?? 0);
  const codeShown = discount?.code ?? (discountError ? discountCode : null);

  let shippingValue: string;
  if (!shipping.requiresShipping) shippingValue = copy.digitalDelivery;
  else if (shipping.isFree) shippingValue = copy.shippingFree;
  else shippingValue = formatMoney(shipping.amount);

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
    <div className={className}>
      <dl className="space-y-1.5 text-sm text-ink">
        <Row label={copy.subtotal} value={formatMoney(lineTotal)} />

        {codeShown ? (
          <Row
            label={
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span>{copy.discount(codeShown)}</span>
                <button
                  type="button"
                  aria-label={cartCopy.discount.removeCode(codeShown)}
                  onClick={clearDiscountCode}
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
          className="mt-3 border-t border-line pt-3"
        />
      </dl>

      <div className="mt-1 flex items-baseline justify-between gap-4 text-xs text-ink-soft">
        <p>{copy.taxesIncluded}</p>
        {pricing.totalSavings > 0 ? (
          <p className="tabular font-medium text-kelp">{`${copy.youSave} ${formatMoney(pricing.totalSavings)}`}</p>
        ) : null}
      </div>

      {showCheckout ? (
        <div className="mt-3.5">
          <Button
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
          <PaymentIcons tone="light" size="sm" className="mt-3 justify-center" />
        </div>
      ) : null}
    </div>
  );
}
