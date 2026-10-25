"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Cart button in the header: opens the cart drawer (useCart().openCart).
 * The count badge shows only after hydration (the server never knows the
 * cart). It sits absolutely on the icon and its box is always rendered, so
 * it never moves anything when it appears.
 */
export function CartButton({ className }: { className?: string }) {
  const { itemCount, hydrated, isOpen, openCart } = useCart();
  const count = hydrated ? itemCount : 0;

  return (
    <Button
      variant="ghost"
      iconOnly
      aria-label={site.header.cart(count)}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={openCart}
      className={className}
    >
      <ShoppingBag aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
      <span
        aria-hidden="true"
        className={cn(
          "tabular pointer-events-none absolute top-2 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] leading-none font-semibold text-fog ring-2 ring-fog",
          "motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out",
          count > 0 ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        {count > 99 ? "99+" : count > 0 ? count : null}
      </span>
    </Button>
  );
}
