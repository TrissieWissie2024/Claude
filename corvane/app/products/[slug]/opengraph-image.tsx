import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

import { productImageResponse } from "@/components/seo/OgImage";
import { getSticks } from "@/lib/catalog";
import { commerce } from "@/lib/commerce";
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/lib/seo";

/**
 * Open Graph image of a product page (1200 x 630): name, family, notes and a
 * drawing of the product in its ring colour (components/seo/OgImage).
 *
 * Static for all nine products: the page's own generateStaticParams does not
 * count for this route, so it has its own; and, as in app/opengraph-image.tsx,
 * the PNG is made in a 'use cache' function so the build can prerender it
 * (Cache Components only prerenders a route handler whose response is
 * complete within one task). The per-product alt text is set where the page
 * references the image (lib/seo.ts productOgImage), so `alt` here is generic.
 */

export const alt = "CORVANE solid cologne";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

export async function generateStaticParams() {
  const products = await commerce.getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

/** The PNG for a product, or null for an unknown slug. */
async function renderProductImage(slug: string): Promise<Uint8Array | null> {
  "use cache";
  cacheLife("max");
  const product = await commerce.getProduct(slug);
  if (!product) return null;
  const products = await commerce.getProducts();
  const response = await productImageResponse(product, getSticks(products));
  return new Uint8Array(await response.arrayBuffer());
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const png = await renderProductImage(slug);
  if (!png) notFound();
  return new Response(png as Uint8Array<ArrayBuffer>, { headers: { "Content-Type": contentType } });
}
