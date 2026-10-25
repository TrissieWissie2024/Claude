import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
