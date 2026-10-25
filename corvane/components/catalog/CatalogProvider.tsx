"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { findProduct, findStick, getSticks } from "@/lib/catalog";
import type { Product, StickProduct } from "@/lib/types";

/**
 * Product data for client components (docs/PLAN.md §11). The root layout
 * fills it once with `await commerce.getProducts()`; client components read it
 * with useCatalog() instead of importing content/products.ts.
 */

export interface CatalogValue {
  /** All products, in catalog order. */
  products: Product[];
  /** The scent sticks, in catalog order. */
  sticks: StickProduct[];
  findProduct: (slug: string) => Product | null;
  /** Like findProduct, but only returns scent sticks. */
  findStick: (slug: string) => StickProduct | null;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export interface CatalogProviderProps {
  products: Product[];
  children: ReactNode;
}

export function CatalogProvider({ products, children }: CatalogProviderProps) {
  const value = useMemo<CatalogValue>(
    () => ({
      products,
      sticks: getSticks(products),
      findProduct: (slug) => findProduct(products, slug),
      findStick: (slug) => findStick(products, slug),
    }),
    [products],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

/** The catalog. Throws when used outside <CatalogProvider>. */
export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog() must be used inside <CatalogProvider>.");
  return value;
}
