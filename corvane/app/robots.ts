import type { MetadataRoute } from "next";

import { absoluteUrl, DISALLOWED_PATHS } from "@/lib/seo";

/**
 * /robots.txt (docs/PLAN.md §12): everything may be crawled except the API
 * routes. The checkout and account stubs stay crawlable on purpose: they are
 * noindex, and a crawler only sees that tag when it may fetch the page
 * (lib/seo.ts DISALLOWED_PATHS, D53).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
