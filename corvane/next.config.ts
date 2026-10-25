import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /*
   * No user agent gets "blocking metadata" (D54.2). By default Next.js 16.4
   * renders every page per request, with no-store, for user agents it counts
   * as HTML-limited bots (Bingbot, DuckDuckBot, Applebot, Twitterbot,
   * facebookexternalhit, Slackbot, LinkedInBot, Google-InspectionTool,
   * Chrome-Lighthouse, ...), so that metadata streamed after the shell
   * still lands in <head>. Every route here is prerendered with its full
   * metadata in <head>, so that render gains nothing. It does cost: those
   * bots never get the cached HTML, and an
   * unknown product slug answered them 200 with noindex instead of 404 (a
   * soft 404). The pattern is a character class that matches nothing, so
   * bots get the same static HTML and status codes as browsers. If a route
   * ever streams its metadata (uncached data in generateMetadata), remove
   * this line or list the bots that need blocking metadata.
   */
  htmlLimitedBots: /[^\s\S]/,
  experimental: {
    /*
     * Fewer, larger client chunks (phase 8). The defaults split the shared code
     * of the home and product pages into 13 to 15 scripts of about 10 KB each;
     * with these limits it is 7 to 8, with the same bytes. Each request costs a
     * round trip on a slow mobile connection (Lighthouse mobile: 150 ms), and
     * the islands that load later (cart drawer, mobile menu, email capture) are
     * separate chunk groups anyway. Sizes are uncompressed, unminified bytes.
     */
    turbopackChunking: {
      minChunkSize: 200000,
      maxChunkCountPerGroup: 6,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
