import type { MetadataRoute } from "next";

import { legalRoutes } from "@/content/legal";
import { commerce } from "@/lib/commerce";
import { absoluteUrl, CONTENT_UPDATED, productPath, STATIC_ROUTES } from "@/lib/seo";

/**
 * /sitemap.xml (docs/PLAN.md §1, §12): the static routes, the legal pages and
 * every product page. /checkout and /account are noindex stubs and are left
 * out. lastModified is a fixed date (CONTENT_UPDATED, update it with the
 * content): `new Date()` would turn the route dynamic and claim a change on
 * every request.
 *
 * No `images` (D54.3): Next.js writes <image:image> straight after <loc>,
 * while the sitemaps.org 0.9 schema wants extension elements after
 * <lastmod>, <changefreq> and <priority>, so a strict validator rejects those
 * entries. The only image per product is its Open Graph card, which og:image
 * and the JSON-LD Product.image already name. Add images again only with real
 * product photos, and check the order Next.js writes then.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await commerce.getProducts();

  const pages: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: CONTENT_UPDATED,
    changeFrequency: path === "/" || path === "/collections/all" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/collections/all" ? 0.9 : 0.5,
  }));

  const legal: MetadataRoute.Sitemap = Object.values(legalRoutes).map((path) => ({
    url: absoluteUrl(path),
    lastModified: CONTENT_UPDATED,
    changeFrequency: "yearly",
    priority: 0.2,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(productPath(product.slug)),
    lastModified: CONTENT_UPDATED,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...pages, ...productPages, ...legal];
}
