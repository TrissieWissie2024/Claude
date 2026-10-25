import type { MetadataRoute } from "next";

import { site } from "@/content/site";

/**
 * /manifest.webmanifest: name, colours and the vane icon (app/icon.svg,
 * app/apple-icon.png), for "Add to Home Screen". Next links it from every page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}: ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "browser",
    background_color: "#F7F5F1",
    theme_color: "#0F2733",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
