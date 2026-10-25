import { localCommerce } from "./local";
import { shopifyCommerce } from "./shopify";
import type { CommerceProvider } from "./types";

export type { CheckoutInput, CheckoutResult, CommerceProvider } from "./types";

/**
 * The commerce provider for server components and route handlers.
 * Chosen by COMMERCE_PROVIDER: "local" (default) or "shopify" (stub, see
 * lib/commerce/shopify.ts). Client components never import this module;
 * they get products through CatalogProvider or props (docs/PLAN.md §11).
 */

export type CommerceProviderName = "local" | "shopify";

const providers: Record<CommerceProviderName, CommerceProvider> = {
  local: localCommerce,
  shopify: shopifyCommerce,
};

/** Reads COMMERCE_PROVIDER; empty or unknown values fall back to "local". */
export function resolveCommerceProviderName(value: string | undefined = process.env.COMMERCE_PROVIDER): CommerceProviderName {
  const name = value?.trim().toLowerCase();
  if (!name) return "local";
  if (name === "local" || name === "shopify") return name;
  console.warn(`COMMERCE_PROVIDER="${value}" is not a known provider; using "local".`);
  return "local";
}

export const commerce: CommerceProvider = providers[resolveCommerceProviderName()];
