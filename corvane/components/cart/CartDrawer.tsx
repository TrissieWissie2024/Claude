"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { CartLine, FreePouchLine } from "@/components/cart/CartLine";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { CartUpsell } from "@/components/cart/CartUpsell";
import { ShippingProgress } from "@/components/cart/ShippingProgress";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { PaymentIcons } from "@/components/layout/PaymentIcons";
import { StickRender } from "@/components/media/StickRender";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cartCopy } from "@/content/cart";

/**
 * The cart drawer (brief §6, docs/PLAN.md §10). A right-hand Sheet (Radix
 * Dialog: focus trap, Esc and overlay click close, focus returns to the
 * element that opened it), controlled by useCart().isOpen / setOpen.
 * Full width on mobile, 27rem from md.
 *
 * Render it once, e.g. in the header; open it with useCart().openCart() or
 * addLine(). It closes itself when the route changes.
 */

const EMPTY_STATE_HEADING_ID = "cart-empty-heading";

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  const { sticks } = useCatalog();
  const copy = cartCopy.empty;
  const trio = sticks.slice(0, 3);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-2 py-10 text-center">
      {trio.length > 0 ? (
        <div aria-hidden="true" className="mb-8 flex items-end justify-center gap-3">
          {trio.map((stick, index) => (
            <StickRender
              key={stick.slug}
              ringColor={stick.ringColor}
              variant={index === 1 ? "open" : "closed"}
              className={index === 1 ? "h-[7.5rem] w-auto" : "h-24 w-auto"}
            />
          ))}
        </div>
      ) : null}
      {/* Focusable for focus after the last removal; it then shows the normal :focus-visible ring. */}
      <h3 id={EMPTY_STATE_HEADING_ID} tabIndex={-1} className="text-[1.75rem] leading-tight text-ink">
        {copy.headline}
      </h3>
      <p className="mt-3 max-w-[18rem] text-[15px] leading-relaxed text-ink-soft">{copy.line}</p>
      <Button href={copy.cta.href} variant="primary" size="md" className="mt-8 min-w-[13rem]" onClick={onNavigate}>
        {copy.cta.label}
      </Button>
      <Button
        href={copy.secondary.href}
        variant="ghost"
        size="sm"
        // ::before: a 44 px tall touch target, same look.
        className="mt-3 underline decoration-ink/25 underline-offset-[3px] before:absolute before:inset-x-0 before:-inset-y-1 hover:decoration-ink"
        onClick={onNavigate}
      >
        {copy.secondary.label}
      </Button>
    </div>
  );
}

export function CartDrawer() {
  const { isOpen, setOpen, closeCart, lines, pricing, hydrated, removeLine } = useCart();
  const listRef = useRef<HTMLUListElement>(null);
  const copy = cartCopy.drawer;

  // Close on navigation (also covers links inside the drawer and the browser's back button).
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    closeCart();
  }, [pathname, closeCart]);

  const pricedById = new Map(pricing.lines.map((priced) => [priced.lineId, priced]));
  const empty = hydrated && lines.length === 0;
  const showGiftPouch = pricing.freePouch.eligible && pricing.freePouch.appliedToLineId === null;

  // After a removal, keep focus inside the list: on the line that took its place, the one before it,
  // or the empty-state heading.
  const handleRemove = (lineId: string) => {
    const index = lines.findIndex((line) => line.id === lineId);
    removeLine(lineId);
    requestAnimationFrame(() => {
      const targets = listRef.current?.querySelectorAll<HTMLElement>("[data-cart-line-focus]");
      const target =
        targets && targets.length > 0
          ? targets[Math.min(Math.max(index, 0), targets.length - 1)]
          : document.getElementById(EMPTY_STATE_HEADING_ID);
      target?.focus({ preventScroll: false });
    });
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setOpen}
      side="right"
      title={copy.title}
      closeLabel={copy.close}
      headerExtra={
        hydrated && pricing.itemCount > 0 ? (
          <span className="tabular mt-1 text-[13px] text-ink-soft">{copy.itemCount(pricing.itemCount)}</span>
        ) : null
      }
      footer={hydrated && !empty ? <CartSummary /> : undefined}
      className="w-full! rounded-none! md:w-[27rem]! md:rounded-l-card!"
      bodyClassName="flex flex-col"
    >
      <div className="flex min-h-full flex-1 flex-col">
        {!hydrated ? null : empty ? (
          <EmptyState onNavigate={closeCart} />
        ) : (
          <>
            <ShippingProgress pricing={pricing} />

            <ul ref={listRef} aria-label={copy.linesLabel} className="mt-2 divide-y divide-line">
              {lines.map((line) => (
                <CartLine key={line.id} line={line} priced={pricedById.get(line.id)} onRemove={handleRemove} />
              ))}
              {showGiftPouch ? <FreePouchLine /> : null}
            </ul>

            <CartUpsell className="border-t border-line pt-6 pb-2" />

            {/* In the scrolling body, not the sticky footer, so the totals take less of a phone screen. */}
            <PaymentIcons tone="light" size="sm" className="mt-auto justify-center pt-6" />
          </>
        )}
      </div>
    </Sheet>
  );
}
