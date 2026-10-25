import type { CartLine, CountryCode, Product } from "@/lib/types";

/**
 * The commerce layer the UI talks to. The local provider reads from content/;
 * a Shopify Storefront API provider can implement the same interface later
 * without UI changes (see README, "Shopify koppelen").
 */
export interface CommerceProvider {
  readonly name: string;
  /** All products, in catalog order. */
  getProducts(): Promise<Product[]>;
  /** One product by slug, or null if it does not exist. */
  getProduct(slug: string): Promise<Product | null>;
  /** Creates a checkout for the cart and returns where to send the customer. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}

export interface CheckoutInput {
  lines: CartLine[];
  discountCode: string | null;
  country: CountryCode;
}

export interface CheckoutResult {
  /** Absolute URL for an external checkout, or a site path for the local demo checkout. */
  checkoutUrl: string;
  provider: string;
}
