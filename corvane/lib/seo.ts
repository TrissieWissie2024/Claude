import type { Metadata } from "next";

import { getProductImage } from "@/content/assets";
import { home } from "@/content/home";
import { offers as defaultOffers } from "@/content/offers";
import { pdp } from "@/content/pdp";
import { reviews as allReviews } from "@/content/reviews";
import { shipping as defaultShipping } from "@/content/shipping";
import { site } from "@/content/site";
import { getFromPrice, isStick } from "@/lib/catalog";
import { getRatingSummary, getReviews } from "@/lib/reviews";
import type { OffersConfig, Product, Review, ShippingConfig } from "@/lib/types";

/**
 * SEO helpers (brief §7, docs/PLAN.md §12): page metadata, Open Graph images
 * and JSON-LD. Pure functions on content and config; server-side only
 * (metadata exports, app/sitemap.ts, app/robots.ts, the OG image routes and
 * components/seo/JsonLd).
 *
 * Open Graph in Next.js 16 is replaced, not merged: a page that sets
 * `openGraph` drops the root's siteName, locale, type and file-based image.
 * pageMetadata() therefore always sets the full object, with the brand image
 * (app/opengraph-image.tsx) or a product image
 * (app/products/[slug]/opengraph-image.tsx). Title and description are left
 * out of `openGraph` and `twitter` on purpose: Next fills them from the
 * page's own title (after the "%s | CORVANE" template) and description.
 *
 * JSON-LD never contains aggregateRating or review unless there are real
 * reviews (brief §2.2): the branch in productJsonLd() reads
 * getRatingSummary(), which is null while content/reviews.ts is empty.
 */

/* ------------------------------------------------------------------ */
/* URLs                                                                */
/* ------------------------------------------------------------------ */

/** The site origin as a URL (metadataBase). From NEXT_PUBLIC_SITE_URL, see content/site.ts. */
export const siteUrl = new URL(site.url);

/** Absolute URL for a site path, e.g. "/about" -> "https://corvane.example/about". */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

export function productPath(slug: string): string {
  return `/products/${slug}`;
}

/**
 * Indexable routes without a slug, in sitemap order (docs/PLAN.md §1).
 * /checkout and /account are noindex stubs and are left out; so is /api.
 * The legal routes are added by app/sitemap.ts from content/legal.ts.
 */
export const STATIC_ROUTES = ["/", "/collections/all", "/about", "/faq", "/contact", "/shipping-returns"] as const;

/**
 * Paths that robots.txt asks crawlers to skip: only the API routes.
 * /checkout and /account are kept out of search with their noindex robots
 * meta instead. A crawler has to fetch a page to see that tag, so blocking
 * them here as well would hide it, and a disallowed URL that is linked from
 * every page (header, cart drawer) can still be indexed without its content.
 */
export const DISALLOWED_PATHS = ["/api/"] as const;

/** Routes that are noindex (robots meta) and therefore must stay crawlable. */
export const NOINDEX_PATHS = ["/checkout", "/account"] as const;

/** Fixed last-modified date for the sitemap. Never computed: `new Date()` would make the route dynamic. */
export const CONTENT_UPDATED = "2026-10-25";

/* ------------------------------------------------------------------ */
/* Open Graph images                                                   */
/* ------------------------------------------------------------------ */

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const OG_IMAGE_TYPE = "image/png";

/** Open Graph locale. The copy uses UK spelling (colour, harbour). */
export const OG_LOCALE = "en_GB";

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  type: string;
}

/** Alt text of the brand image (app/opengraph-image.tsx). */
export const BRAND_OG_ALT = `${site.name}: ${site.tagline} ${home.hero.renderAlt}.`;

/** The brand image, used by every page without an image of its own. */
export const brandOgImage: OgImage = {
  url: "/opengraph-image",
  ...OG_IMAGE_SIZE,
  alt: BRAND_OG_ALT,
  type: OG_IMAGE_TYPE,
};

/** Alt text of a product image (app/products/[slug]/opengraph-image.tsx). */
export function productOgAlt(product: Product): string {
  switch (product.kind) {
    case "stick": {
      const notes = [...product.notes.top, ...product.notes.heart, ...product.notes.base].join(", ");
      return `${site.renders.stick(product.name)}. ${product.family}: ${notes}.`;
    }
    case "discovery-set":
      return `${product.name}: ${product.tagline}`;
    case "pouch":
      return `${product.name}: ${product.tagline}`;
    case "gift-card":
      return `${site.renders.giftCard}: ${product.tagline}`;
  }
}

/** The image of one product page. */
export function productOgImage(product: Product): OgImage {
  return {
    url: `${productPath(product.slug)}/opengraph-image`,
    ...OG_IMAGE_SIZE,
    alt: productOgAlt(product),
    type: OG_IMAGE_TYPE,
  };
}

function capitalise(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

/** "Sea salt, bergamot · Sage · White cedar": top, heart and base, each group capitalised. */
export function formatNotes(notes: { top: string[]; heart: string[]; base: string[] }): string {
  return [notes.top, notes.heart, notes.base]
    .filter((group) => group.length > 0)
    .map((group) => capitalise(group.join(", ")))
    .join(" · ");
}

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

/** Open Graph fields every page shares. The root layout uses them as the default. */
export const baseOpenGraph = {
  siteName: site.name,
  locale: OG_LOCALE,
  type: "website",
} as const;

/**
 * Full Open Graph object for one page: the shared fields, its URL and its
 * image. Title and description come from the page metadata (see top).
 */
export function pageOpenGraph(path: string, image: OgImage = brandOgImage): NonNullable<Metadata["openGraph"]> {
  return { ...baseOpenGraph, url: path, images: [image] };
}

export interface PageSeo {
  /** Page title; the root template adds " | CORVANE". Use { absolute } to skip it. */
  title: NonNullable<Metadata["title"]>;
  description: string;
  /** Canonical path, e.g. "/about". */
  path: string;
  /** Social image. Default: the brand image. */
  image?: OgImage;
  /** Robots override, e.g. noindex for stubs. Default: indexable (inherits the defaults). */
  robots?: Metadata["robots"];
}

/** Metadata for one page: title, description, canonical URL, Open Graph (and through it, Twitter). */
export function pageMetadata({ title, description, path, image, robots }: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: pageOpenGraph(path, image),
    ...(robots ? { robots } : {}),
  };
}

/** Metadata for a product page: product.seo, canonical /products/<slug> and its own OG image. */
export function productMetadata(product: Product): Metadata {
  return pageMetadata({
    title: product.seo.title,
    description: product.seo.description,
    path: productPath(product.slug),
    image: productOgImage(product),
  });
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

export type JsonLdNode = { "@type": string } & Record<string, unknown>;

export interface JsonLdDocument {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

/** One JSON-LD document with several nodes. */
export function jsonLdGraph(...nodes: JsonLdNode[]): JsonLdDocument {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * JSON for a <script type="application/ld+json">. Every "<" is escaped as
 * <, so a "</script>" inside a string can never close the element.
 */
export function serializeJsonLd(data: JsonLdDocument): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Schema.org decimal for integer cents, e.g. 2495 -> "24.95". Not for display:
 * customer-facing amounts go through lib/money.ts.
 */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const ORGANIZATION_ID = absoluteUrl("/#organization");
const WEBSITE_ID = absoluteUrl("/#website");

/** Social profiles for sameAs: only real ones. The launch placeholders are left out. */
export function realSocialProfiles(): string[] {
  return site.socials.filter((social) => !social.placeholder).map((social) => social.href);
}

/**
 * The brand. No legalName, address, email or sameAs while those are
 * placeholders (content/site.ts, docs/TODO-LAUNCH.md); they are added
 * automatically for socials once `placeholder` is removed.
 */
export function organizationJsonLd(): JsonLdNode {
  const sameAs = realSocialProfiles();
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: absoluteUrl("/"),
    // app/apple-icon.png: the vane on deep, 180 x 180 (Google asks for at least 112 x 112).
    logo: { "@type": "ImageObject", url: absoluteUrl("/apple-icon.png"), width: 180, height: 180 },
    description: site.description,
    slogan: site.tagline,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    inLanguage: site.locale,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Organization and WebSite, for the homepage. */
export function homeJsonLd(): JsonLdDocument {
  return jsonLdGraph(organizationJsonLd(), websiteJsonLd());
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Home / Shop / product: the same trail as the visible breadcrumb on the product page. */
export function productBreadcrumbJsonLd(product: Product): JsonLdNode {
  return breadcrumbJsonLd([
    { name: pdp.breadcrumb.home, path: "/" },
    { name: pdp.breadcrumb.shop, path: "/collections/all" },
    { name: product.name, path: productPath(product.slug) },
  ]);
}

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/**
 * Shipping per country for an offer at `priceCents`, from content/shipping.ts:
 * the flat rate (or 0 from the free-shipping threshold), the dispatch days,
 * handling (same day before the cut-off, else the next dispatch day) and the
 * transit time in working days.
 */
export function shippingDetailsJsonLd(priceCents: number, config: ShippingConfig = defaultShipping): JsonLdNode[] {
  const businessDays = {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: config.dispatchWeekdays.map((day) => `https://schema.org/${SCHEMA_DAYS[day - 1]}`),
  };
  return config.countries.map((country) => ({
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: centsToDecimal(priceCents >= country.freeFrom ? 0 : country.rate),
      currency: "EUR",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: country.code },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      businessDays,
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: country.transitDays.min,
        maxValue: country.transitDays.max,
        unitCode: "DAY",
      },
    },
  }));
}

const IN_STOCK = "https://schema.org/InStock";
const NEW_CONDITION = "https://schema.org/NewCondition";

/**
 * The offer of a product page. Sticks, the Discovery Set and the pouch: one
 * Offer at the one-time price of a single unit (getFromPrice), with shipping.
 * The e-gift card: an AggregateOffer over its denominations, digital, so no
 * shipping. The launch code is a code, not a price, so it is not in here.
 */
export function offerJsonLd(product: Product, offers: OffersConfig = defaultOffers): JsonLdNode {
  const url = absoluteUrl(productPath(product.slug));
  const seller = { "@type": "Organization", name: site.name };

  if (product.kind === "gift-card") {
    const amounts = [...offers.giftCardDenominations].sort((a, b) => a - b);
    return {
      "@type": "AggregateOffer",
      url,
      priceCurrency: offers.currency,
      lowPrice: centsToDecimal(amounts[0] ?? 0),
      highPrice: centsToDecimal(amounts[amounts.length - 1] ?? 0),
      offerCount: amounts.length,
      availability: IN_STOCK,
      itemCondition: NEW_CONDITION,
      seller,
    };
  }

  const price = getFromPrice(product, offers);
  return {
    "@type": "Offer",
    url,
    price: centsToDecimal(price),
    priceCurrency: offers.currency,
    availability: IN_STOCK,
    itemCondition: NEW_CONDITION,
    seller,
    shippingDetails: shippingDetailsJsonLd(price),
  };
}

function reviewJsonLd(review: Review): JsonLdNode {
  return {
    "@type": "Review",
    author: { "@type": "Person", name: review.author },
    datePublished: review.date,
    name: review.title,
    reviewBody: review.body,
    reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
  };
}

/** Product images: a real packshot once supplied (content/assets.ts), then the OG image. Absolute URLs. */
export function productImages(product: Product): string[] {
  const packshot = getProductImage(product.slug, "packshot")?.src;
  return [...(packshot ? [absoluteUrl(packshot)] : []), absoluteUrl(productOgImage(product).url)];
}

/** Most recent reviews included in the Product node, when there are any. */
const MAX_REVIEWS = 10;

export interface ProductJsonLdOptions {
  offers?: OffersConfig;
  /** Review source; defaults to content/reviews.ts (empty at launch). */
  reviews?: readonly Review[];
}

/**
 * Product node. aggregateRating and review appear only when
 * getRatingSummary() finds real reviews for this product (brief §2.2).
 */
export function productJsonLd(product: Product, options: ProductJsonLdOptions = {}): JsonLdNode {
  const { offers = defaultOffers, reviews = allReviews } = options;
  const url = absoluteUrl(productPath(product.slug));
  const rating = getRatingSummary(product.slug, reviews);

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description,
    sku: product.slug,
    url,
    image: productImages(product),
    brand: { "@type": "Brand", name: site.name },
    ...(isStick(product)
      ? {
          additionalProperty: [
            { "@type": "PropertyValue", name: "Scent family", value: product.family },
            { "@type": "PropertyValue", name: "Top notes", value: product.notes.top.join(", ") },
            { "@type": "PropertyValue", name: "Heart notes", value: product.notes.heart.join(", ") },
            { "@type": "PropertyValue", name: "Base notes", value: product.notes.base.join(", ") },
          ],
        }
      : {}),
    offers: offerJsonLd(product, offers),
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: getReviews(product.slug, reviews).slice(0, MAX_REVIEWS).map(reviewJsonLd),
        }
      : {}),
  };
}

/** Product and BreadcrumbList, for a product page. */
export function productPageJsonLd(product: Product, options?: ProductJsonLdOptions): JsonLdDocument {
  return jsonLdGraph(productJsonLd(product, options), productBreadcrumbJsonLd(product));
}
