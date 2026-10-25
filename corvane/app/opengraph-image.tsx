import { cacheLife } from "next/cache";

import { brandImageResponse } from "@/components/seo/OgImage";
import { commerce } from "@/lib/commerce";
import { BRAND_OG_ALT, OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/lib/seo";

/**
 * The brand Open Graph image (1200 x 630), the default for every page
 * without an image of its own (lib/seo.ts brandOgImage). Drawing:
 * components/seo/OgImage.
 *
 * Static (prerendered at build time). With Cache Components a route handler
 * is only prerendered when its response is complete within one task, and
 * reading the fonts and rendering the PNG take longer; so the PNG is made in
 * a 'use cache' function, which the build waits for, and the handler only
 * wraps the cached bytes.
 */

export const alt = BRAND_OG_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

async function renderBrandImage(): Promise<Uint8Array> {
  "use cache";
  cacheLife("max");
  const products = await commerce.getProducts();
  const response = await brandImageResponse(products);
  return new Uint8Array(await response.arrayBuffer());
}

export default async function Image() {
  const png = await renderBrandImage();
  return new Response(png as Uint8Array<ArrayBuffer>, { headers: { "Content-Type": contentType } });
}
