"use client";

import { Check, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCartActions } from "@/components/cart/CartProvider";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { productCard } from "@/content/collection";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";
import type { NewCartLine, Product } from "@/lib/types";

/**
 * Quick add on a product card (docs/PLAN.md §11):
 * - a scent stick adds 1 stick of that scent, one-time;
 * - the Discovery Set and the Travel Pouch add 1;
 * - the e-gift card has several amounts, so it links to its product page
 *   ("Choose amount") instead.
 * Adding opens the cart drawer. CartProvider announces the change in its
 * polite live region; the button shows "Added" for a moment.
 *
 * Sits above the card's stretched link (relative z-10), so it stays clickable.
 * The button draws 36 px (size sm) but its hit area is 44 px tall: a ::before
 * overlay 5 px past its padding box (inside the 1 px border) above and below,
 * so the look and the card rhythm stay the same.
 * While it shows "Added", its accessible name starts with that word too
 * ("Added: North Swell", WCAG 2.5.3).
 */

/** How long the button shows "Added", in ms. */
const ADDED_MS = 1800;

/** The cart line quick add creates, or null when the product needs a choice first (gift cards). */
export function getQuickAddLine(product: Product): NewCartLine | null {
  switch (product.kind) {
    case "stick":
      return { kind: "stick", scents: [product.slug], plan: { type: "one-time" }, quantity: 1 };
    case "discovery-set":
      return { kind: "discovery-set", slug: "discovery-set", quantity: 1 };
    case "pouch":
      return { kind: "pouch", slug: "travel-pouch", quantity: 1 };
    case "gift-card":
      return null;
  }
}

export interface QuickAddProps {
  product: Product;
  /** Default "outline". */
  variant?: ButtonVariant;
  /** Default "sm". */
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function QuickAdd({ product, variant = "outline", size = "sm", fullWidth = false, className }: QuickAddProps) {
  const { addLine } = useCartActions();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear a pending reset when the card unmounts (e.g. a filter removes it).
  useEffect(() => {
    const pending = timer;
    return () => clearTimeout(pending.current);
  }, []);

  const line = getQuickAddLine(product);
  const classes = cn("relative z-10 min-w-[5.75rem] before:absolute before:inset-x-0 before:-inset-y-[5px]", className);

  if (!line) {
    return (
      <Button
        href={`/products/${product.slug}`}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        aria-label={home.productGrid.card.chooseAmountLabel(product.name)}
        className={classes}
      >
        {home.productGrid.card.chooseAmount}
      </Button>
    );
  }

  const handleClick = () => {
    // 0 when the cart line is already at its limit: the drawer opens, the button does not claim "Added".
    if (addLine(line, { open: true }) === 0) return;
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), ADDED_MS);
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleClick}
      aria-label={added ? home.productGrid.card.addedLabel(product.name) : productCard.quickAddLabel(product.name)}
      iconStart={
        added ? (
          <Check aria-hidden="true" className="size-4" strokeWidth={2} />
        ) : (
          <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
        )
      }
      className={classes}
    >
      {added ? productCard.added : productCard.quickAdd}
    </Button>
  );
}
