import { products } from "@/content/products";
import { findProduct } from "@/lib/catalog";
import type { Product } from "@/lib/types";

import type { CheckoutInput, CheckoutResult, CommerceProvider } from "./types";

/**
 * Local commerce provider: the catalog from content/products.ts, prices from
 * content/offers.ts (via lib/pricing.ts), and the demo checkout at /checkout.
 *
 * This is the only module that imports content/products.ts (docs/PLAN.md §11).
 * Everything else gets products through `commerce` (lib/commerce/index.ts) on
 * the server, or useCatalog() / props on the client.
 */

/** Path of the demo checkout page. It reads the cart from the CartProvider, not from the request. */
export const LOCAL_CHECKOUT_PATH = "/checkout";

export const localCommerce: CommerceProvider = {
  name: "local",

  async getProducts(): Promise<Product[]> {
    // A copy, so callers can sort or filter without touching the module data.
    return [...products];
  },

  async getProduct(slug: string): Promise<Product | null> {
    return findProduct(products, slug);
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    // The demo checkout needs no server-side session: /checkout prices the
    // cart from the same localStorage state with lib/pricing.ts. The input is
    // accepted for interface parity with an external provider.
    void input;
    return { checkoutUrl: LOCAL_CHECKOUT_PATH, provider: "local" };
  },
};
