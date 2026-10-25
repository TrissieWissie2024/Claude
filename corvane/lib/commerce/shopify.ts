import type { CartLine, Product } from "@/lib/types";

import type { CheckoutInput, CheckoutResult, CommerceProvider } from "./types";

/**
 * Shopify Storefront API provider: a typed stub.
 *
 * Every method throws ShopifyNotConfiguredError until the integration is
 * built. The UI never notices which provider runs: it only talks to
 * `commerce` from lib/commerce/index.ts, which picks this provider when
 * COMMERCE_PROVIDER=shopify.
 *
 * Environment (server only, never NEXT_PUBLIC_):
 * - SHOPIFY_STORE_DOMAIN       e.g. "corvane.myshopify.com"
 * - SHOPIFY_STOREFRONT_TOKEN   Storefront API access token (public or private token)
 * - SHOPIFY_STOREFRONT_API_VERSION (optional) a supported version, e.g. "2026-10"
 *
 * Requests go to POST https://{SHOPIFY_STORE_DOMAIN}/api/{version}/graphql.json
 * with the header "X-Shopify-Storefront-Access-Token: {SHOPIFY_STOREFRONT_TOKEN}"
 * (or "Shopify-Storefront-Private-Token" for a private token). Cache product
 * reads with 'use cache' + cacheLife('hours') in a helper; never in a route
 * segment config (Cache Components, see the Next.js primer).
 *
 * Mapping from our data model:
 *
 * 1. Products. Keep content/products.ts as the editorial source (notes,
 *    family, ring colour, intensity, copy) and link each product to Shopify
 *    through Product.externalIds:
 *    - shopifyHandle: the Shopify product handle (defaults to our slug).
 *    - shopifyVariantIds: variant GIDs ("gid://shopify/ProductVariant/...")
 *      keyed by our variant key: "default" for sticks, the Discovery Set and
 *      the pouch; the amount in cents ("2500", "5000", "10000") for the gift
 *      card variants.
 *    - shopifySellingPlanIds: selling plan GIDs for Subscribe & save, keyed by
 *      interval in months (1, 2, 3), from the subscription app's selling plan
 *      group (15% price adjustment per delivery).
 *    getProducts() can then query `products(first: 50)` or
 *    `product(handle: ...)` only for availability and ids, and merge.
 *
 * 2. Prices. Shopify variant prices must equal content/offers.ts. Bundle
 *    pricing (3 for 59.95, 2 for 44.95, grouped per purchase type, D10) and
 *    the free Travel Pouch (from 3 sticks, one per order, D11) need automatic
 *    discounts or a Shopify Function (Discount API). Subscription rounding per
 *    bundle (D12) must be checked against the selling plan price adjustment
 *    before launch (docs/TODO-LAUNCH.md).
 *
 * 3. Checkout. createCheckout() runs the `cartCreate` mutation:
 *
 *      mutation CartCreate($input: CartInput!, $country: CountryCode)
 *        @inContext(country: $country) {
 *        cartCreate(input: $input) {
 *          cart { id checkoutUrl }
 *          userErrors { field message }
 *        }
 *      }
 *
 *    with the input from toShopifyCartInput() below: one merchandise line per
 *    stick scent (a set of 3 becomes three lines, each with the set quantity
 *    and a "_set" attribute so the bundle discount can group them), the
 *    sellingPlanId for subscription lines, `discountCodes: [code]` (Shopify
 *    validates codes itself; WELCOME10 and LAUNCH15 must exist there too), and
 *    `buyerIdentity.countryCode` for shipping rates. The result's
 *    cart.checkoutUrl is returned as checkoutUrl. userErrors become an error.
 */

/** Our variant key for products with a single variant. */
export const SHOPIFY_DEFAULT_VARIANT_KEY = "default";

export interface ShopifyConfig {
  storeDomain: string;
  storefrontToken: string;
  apiVersion: string;
}

/** Storefront API `CartLineInput`, the fields we use. */
export interface ShopifyCartLineInput {
  merchandiseId: string;
  quantity: number;
  sellingPlanId?: string;
  attributes?: { key: string; value: string }[];
}

/** Storefront API `CartInput`, the fields we use. */
export interface ShopifyCartInput {
  lines: ShopifyCartLineInput[];
  discountCodes: string[];
  buyerIdentity: { countryCode: string };
}

export class ShopifyNotConfiguredError extends Error {
  constructor(detail?: string) {
    super(
      "The Shopify commerce provider is not configured. Set SHOPIFY_STORE_DOMAIN and " +
        "SHOPIFY_STOREFRONT_TOKEN and implement lib/commerce/shopify.ts, or unset " +
        "COMMERCE_PROVIDER to use the local provider." +
        (detail ? ` ${detail}` : ""),
    );
    this.name = "ShopifyNotConfiguredError";
  }
}

/** Reads the Shopify environment. Null when a required variable is missing. */
export function getShopifyConfig(env: Record<string, string | undefined> = process.env): ShopifyConfig | null {
  const storeDomain = env.SHOPIFY_STORE_DOMAIN?.trim();
  const storefrontToken = env.SHOPIFY_STOREFRONT_TOKEN?.trim();
  if (!storeDomain || !storefrontToken) return null;
  return {
    storeDomain,
    storefrontToken,
    apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-10",
  };
}

function variantId(product: Product | undefined, key: string): string {
  const id = product?.externalIds?.shopifyVariantIds?.[key];
  if (!id) {
    throw new ShopifyNotConfiguredError(
      `Missing externalIds.shopifyVariantIds["${key}"] for product "${product?.slug ?? "unknown"}".`,
    );
  }
  return id;
}

function linesFor(line: CartLine, products: readonly Product[]): ShopifyCartLineInput[] {
  const bySlug = (slug: string) => products.find((product) => product.slug === slug);
  switch (line.kind) {
    case "stick": {
      const sellingPlanId =
        line.plan.type === "subscription"
          ? bySlug(line.scents[0])?.externalIds?.shopifySellingPlanIds?.[line.plan.intervalMonths]
          : undefined;
      if (line.plan.type === "subscription" && !sellingPlanId) {
        throw new ShopifyNotConfiguredError(`Missing selling plan for "${line.scents[0]}".`);
      }
      return line.scents.map((slug) => ({
        merchandiseId: variantId(bySlug(slug), SHOPIFY_DEFAULT_VARIANT_KEY),
        quantity: line.quantity,
        ...(sellingPlanId ? { sellingPlanId } : {}),
        attributes: [{ key: "_set", value: line.id }],
      }));
    }
    case "gift-card":
      return [{ merchandiseId: variantId(bySlug(line.slug), String(line.amount)), quantity: line.quantity }];
    case "discovery-set":
    case "pouch":
      return [{ merchandiseId: variantId(bySlug(line.slug), SHOPIFY_DEFAULT_VARIANT_KEY), quantity: line.quantity }];
  }
}

/**
 * Maps our checkout input to a Storefront API CartInput (pure, no network).
 * Throws ShopifyNotConfiguredError when a product has no Shopify ids yet.
 */
export function toShopifyCartInput(input: CheckoutInput, products: readonly Product[]): ShopifyCartInput {
  return {
    lines: input.lines.flatMap((line) => linesFor(line, products)),
    discountCodes: input.discountCode ? [input.discountCode] : [],
    buyerIdentity: { countryCode: input.country },
  };
}

export const shopifyCommerce: CommerceProvider = {
  name: "shopify",

  async getProducts(): Promise<Product[]> {
    // Query `products(first: 50) { nodes { handle variants(first: 10) { nodes { id } } } }`
    // and merge with content/products.ts by externalIds.shopifyHandle.
    throw new ShopifyNotConfiguredError();
  },

  async getProduct(slug: string): Promise<Product | null> {
    // Query `product(handle: $handle)`; return null when Shopify returns null.
    void slug;
    throw new ShopifyNotConfiguredError();
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    // const config = getShopifyConfig();
    // const cartInput = toShopifyCartInput(input, await shopifyCommerce.getProducts());
    // POST the CartCreate mutation above; return { checkoutUrl: cart.checkoutUrl, provider: "shopify" }.
    void input;
    throw new ShopifyNotConfiguredError();
  },
};
