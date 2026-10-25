"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { pdp } from "@/content/pdp";
import { getProductAnalytics, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { getBundleTileQuote } from "@/lib/pricing";
import type { BundleSize, Product, PurchasePlan, StickProduct } from "@/lib/types";

import { BundlePicker } from "./BundlePicker";
import { MixAndMatch } from "./MixAndMatch";
import { resolveSetScents, usePdpState } from "./PdpStateProvider";
import { PurchaseTypePicker } from "./PurchaseTypePicker";
import { ScentSwatches } from "./ScentSwatches";
import { AddToCartLabel, StickyAddToCart } from "./StickyAddToCart";

/**
 * The buy box of a scent stick page (docs/PLAN.md §9), in this order:
 * scent swatches · bundle tiles · mix & match (2 or 3 sticks) · purchase type
 * (+ interval) · Add to cart · `children` (the page puts DeliveryEstimate and
 * TrustRow here) · the mobile sticky bar.
 *
 * The choices live in PdpStateProvider (app/products/layout.tsx), so they
 * survive switching scents. Stick 1 is always this page's scent. Add to cart
 * adds one set: { kind: "stick", scents: [page, ...sticks 2 and 3], plan,
 * quantity: 1 } and opens the drawer; CartProvider fires add_to_cart and
 * announces the change. view_item fires once per page view.
 *
 * Rendered by the server page with the product and the stick list as props.
 */

export interface ProductConfiguratorProps {
  product: StickProduct;
  /** All scent sticks, in catalog order (for the swatches and mix & match). */
  sticks: StickProduct[];
  /** Rendered right under the Add to cart button (DeliveryEstimate, TrustRow). */
  children?: ReactNode;
  className?: string;
}

/**
 * Fires view_item once per product page view. Deferred by a tick and
 * cancelled on cleanup, so React's development double effect does not send
 * it twice. When Activity shows a hidden product page again (back
 * navigation), that is a new view and it fires again.
 */
export function useTrackViewItem(product: Product, price?: number): void {
  useEffect(() => {
    const timer = setTimeout(() => track("view_item", getProductAnalytics(product, price)), 0);
    return () => clearTimeout(timer);
    // One event per product (and price) shown; the object identity of `product` does not matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug, price]);
}

/** Short plan name for summaries: "One-time" or "Every 2 months". */
export function planSummary(plan: PurchasePlan): string {
  return plan.type === "subscription"
    ? pdp.purchaseType.intervals[plan.intervalMonths]
    : pdp.purchaseType.oneTimeShort;
}

/** Size and plan of the chosen set, for the sticky bar: ["3 sticks", "Every 2 months"]. */
export function selectionParts(size: BundleSize, plan: PurchasePlan): string[] {
  return [pdp.bundle.tiles[size], planSummary(plan)];
}

export function ProductConfigurator({ product, sticks, children, className }: ProductConfiguratorProps) {
  const state = usePdpState();
  const { addLine } = useCart();
  const buttonRef = useRef<HTMLDivElement>(null);

  useTrackViewItem(product);

  const { bundleSize, purchaseType, intervalMonths, extraScents, plan } = state;
  const scents = resolveSetScents(
    product.slug,
    bundleSize,
    extraScents,
    sticks.map((stick) => stick.slug),
  );
  const total = getBundleTileQuote(bundleSize, plan).total;
  const price = formatMoney(total);

  const handleAdd = () => {
    addLine({ kind: "stick", scents, plan, quantity: 1 }, { open: true });
  };

  return (
    <div className={cn("flex flex-col gap-7 md:gap-8", className)}>
      <ScentSwatches sticks={sticks} currentSlug={product.slug} />

      <div className="flex flex-col gap-3">
        <BundlePicker value={bundleSize} onChange={state.setBundleSize} plan={plan} />
        <MixAndMatch
          sticks={sticks}
          pageSlug={product.slug}
          bundleSize={bundleSize}
          extraScents={extraScents}
          onChange={(slot, slug) => state.setExtraScent(slot, slug, product.slug)}
        />
      </div>

      <PurchaseTypePicker
        purchaseType={purchaseType}
        intervalMonths={intervalMonths}
        onPurchaseTypeChange={state.setPurchaseType}
        onIntervalChange={state.setIntervalMonths}
        oneTimePrice={getBundleTileQuote(bundleSize, "one-time").total}
        subscriptionPrice={getBundleTileQuote(bundleSize, "subscription").total}
      />

      <div className="flex flex-col gap-5">
        <div ref={buttonRef}>
          <Button variant="primary" size="lg" fullWidth onClick={handleAdd}>
            <AddToCartLabel price={price} />
          </Button>
        </div>
        {children}
      </div>

      <StickyAddToCart
        targetRef={buttonRef}
        title={product.name}
        summary={selectionParts(bundleSize, plan)}
        price={price}
        onAdd={handleAdd}
        ringColor={product.ringColor}
      />
    </div>
  );
}
