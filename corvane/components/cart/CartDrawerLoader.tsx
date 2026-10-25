"use client";

import dynamic from "next/dynamic";

import { useCart } from "@/components/cart/CartProvider";
import { useAfterLoad, useLatch } from "@/lib/hooks/useAfterLoad";

/** The drawer and everything in it (Radix Dialog, lines, upsell, summary) in a chunk of its own. */
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer").then((module) => module.CartDrawer), {
  ssr: false,
});

/**
 * Mounts the cart drawer (components/cart/CartDrawer) once the page has
 * settled (useAfterLoad: loaded and idle, or the first interaction), or right
 * away when something opens the cart before that. A closed drawer renders
 * nothing, so the server HTML and the first paint are the same as before;
 * only its JavaScript loads later, off the critical path (phase 8).
 * Render it once, in app/layout.tsx, inside CartProvider.
 */
export function CartDrawerLoader() {
  const { isOpen } = useCart();
  const settled = useAfterLoad();
  const needed = useLatch(isOpen);
  return settled || needed ? <CartDrawer /> : null;
}
