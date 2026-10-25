"use client";

import { Mail } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { offers } from "@/content/offers";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyShort } from "@/lib/money";
import type { DiscoverySetProduct, GiftCardProduct, NewCartLine, PouchProduct } from "@/lib/types";

import { optionTileClasses, RadioMark } from "./BundlePicker";
import { useTrackViewItem } from "./ProductConfigurator";
import { AddToCartLabel, StickyAddToCart } from "./StickyAddToCart";

/**
 * The buy box for the products without scent choices (docs/PLAN.md §9):
 * - Discovery Set and Travel Pouch: a quantity stepper, "One-time purchase."
 *   and Add to cart with the live total (one-time only). The pouch adds that
 *   it is free with 3 or more sticks (one per order). The unit price itself
 *   is in the title block above (ProductInfo).
 * - E-gift card: amount tiles from offers.giftCardDenominations (a native
 *   radio group, the lowest amount preselected), "Delivered by email. No
 *   shipping." and Add to cart with { kind: "gift-card", amount, quantity: 1 }.
 * `children` render right under the button (DeliveryEstimate, TrustRow), and
 * the same mobile sticky bar as on stick pages follows the main button.
 * view_item fires once per page view.
 */

export type SimpleProduct = DiscoverySetProduct | PouchProduct | GiftCardProduct;

export interface SimpleConfiguratorProps {
  product: SimpleProduct;
  /** Rendered right under the Add to cart button (DeliveryEstimate, TrustRow). */
  children?: ReactNode;
  className?: string;
}

export function SimpleConfigurator(props: SimpleConfiguratorProps) {
  return props.product.kind === "gift-card" ? (
    <GiftCardConfigurator {...props} product={props.product} />
  ) : (
    <QuantityConfigurator {...props} product={props.product} />
  );
}

/* ------------------------------------------------------------------ */
/* Discovery Set and Travel Pouch                                      */
/* ------------------------------------------------------------------ */

function QuantityConfigurator({
  product,
  children,
  className,
}: SimpleConfiguratorProps & { product: DiscoverySetProduct | PouchProduct }) {
  const { addLine } = useCart();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);

  const isPouch = product.kind === "pouch";
  const unitPrice = isPouch ? offers.prices.travelPouch : offers.prices.discoverySet;
  const price = formatMoney(unitPrice * quantity);
  useTrackViewItem(product, unitPrice);

  const handleAdd = () => {
    const line: NewCartLine = isPouch
      ? { kind: "pouch", slug: "travel-pouch", quantity }
      : { kind: "discovery-set", slug: "discovery-set", quantity };
    addLine(line, { open: true });
  };

  return (
    <div className={cn("flex flex-col gap-7 md:gap-8", className)}>
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="label-caps text-ink-soft">{pdp.quantity.label}</span>
            <QuantityStepper value={quantity} onChange={setQuantity} itemName={product.name} size="md" />
          </div>
          <div className="mt-3 flex flex-col gap-1 text-sm leading-5">
            {isPouch ? <p className="font-medium text-kelp">{pdp.travelPouch.freeWith}</p> : null}
            <p className="text-ink-soft">{isPouch ? pdp.travelPouch.oneTimeOnly : pdp.discoverySet.oneTimeOnly}</p>
          </div>
        </div>
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
        summary={pdp.stickyBar.quantity(quantity)}
        price={price}
        onAdd={handleAdd}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* E-gift card                                                         */
/* ------------------------------------------------------------------ */

function GiftCardConfigurator({
  product,
  children,
  className,
}: SimpleConfiguratorProps & { product: GiftCardProduct }) {
  const { addLine } = useCart();
  const buttonRef = useRef<HTMLDivElement>(null);
  const name = useId();
  const amounts = offers.giftCardDenominations;
  const [amount, setAmount] = useState<number>(amounts[0] ?? 0);
  const price = formatMoney(amount);
  useTrackViewItem(product);

  const handleAdd = () => {
    addLine({ kind: "gift-card", slug: "e-gift-card", amount, quantity: 1 }, { open: true });
  };

  return (
    <div className={cn("flex flex-col gap-7 md:gap-8", className)}>
      <fieldset>
        <legend className="label-caps mb-3 text-ink-soft">{pdp.giftCard.amountLegend}</legend>
        <div className="grid grid-cols-3 gap-2.5">
          {amounts.map((value) => {
            const selected = value === amount;
            return (
              <label
                key={value}
                className={cn(
                  "group flex h-16 cursor-pointer items-center justify-center gap-2.5 px-3 md:h-[4.5rem]",
                  optionTileClasses(selected),
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={value}
                  checked={selected}
                  onChange={() => setAmount(value)}
                  className="sr-only"
                />
                <RadioMark selected={selected} />
                <span className="tabular font-serif text-[1.375rem] leading-none text-ink md:text-2xl">
                  {pdp.giftCard.amount(formatMoneyShort(value))}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm leading-5 text-ink">
          <Mail aria-hidden="true" className="size-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
          {pdp.delivery.giftCard}
        </p>
        <p className="mt-1 pl-6 text-xs leading-[1.125rem] text-ink-soft">{pdp.giftCard.codesNote}</p>
      </fieldset>

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
        summary={pdp.stickyBar.giftCard(formatMoneyShort(amount))}
        price={price}
        onAdd={handleAdd}
      />
    </div>
  );
}
