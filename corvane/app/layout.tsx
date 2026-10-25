import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";

import { WordmarkDefs } from "@/components/brand/Wordmark";
import { CartDrawerLoader } from "@/components/cart/CartDrawerLoader";
import { CartProvider } from "@/components/cart/CartProvider";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { AnalyticsLoader } from "@/components/consent/AnalyticsLoader";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { EmailCaptureLoader } from "@/components/email/EmailCaptureLoader";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InstantReveal } from "@/components/layout/InstantReveal";
import { PromoBar } from "@/components/layout/PromoBar";
import { RouteFocus } from "@/components/layout/RouteFocus";
import { SkipLink } from "@/components/layout/SkipLink";
import { StickDefs } from "@/components/media/StickRender";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { commerce } from "@/lib/commerce";
import { baseOpenGraph, siteUrl } from "@/lib/seo";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces",
  display: "swap",
});

/**
 * Inter, self-hosted (phase 8): Google Fonts' Inter latin subset (the same 230
 * characters and OpenType features) with the weight axis limited to 400-700
 * (fontTools varLib.instancer wght=400:700, then pyftsubset to woff2). The
 * site uses 400, 500 and 600 (700 covers `bolder`). 34 KB instead of the 48 KB
 * of the full 100-900 axis, and it is preloaded like the heading font, so the
 * browser fetches it with the HTML. SIL OFL 1.1, see assets/fonts/OFL-Inter.txt.
 */
const inter = localFont({
  src: "../assets/fonts/Inter-latin-wght400-700.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

/**
 * Site-wide metadata (docs/PLAN.md §12, lib/seo.ts). metadataBase makes the
 * canonical and Open Graph URLs absolute. No canonical here: every page sets
 * its own (a root canonical would be inherited by pages without one). Pages
 * that set `openGraph` replace this object, so they use pageMetadata(), which
 * repeats the shared fields. Pages without one (checkout, account, 404)
 * inherit it with the brand image from app/opengraph-image.tsx; Twitter
 * takes title, description and image from Open Graph. Icons come from
 * app/icon.svg, app/favicon.ico and app/apple-icon.png, the manifest from
 * app/manifest.ts.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: `${site.name} | ${home.meta.title}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: { ...baseOpenGraph },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0F2733",
};

/**
 * Root layout (docs/PLAN.md §2, §10). A server component. In <head>, besides
 * the metadata: InstantReveal (an inline script: prerendered Suspense content
 * shows as soon as it is parsed, without React's 300 ms reveal throttle).
 * The chrome around every page, in DOM order:
 *   SkipLink (z-70, only visible on focus) ·
 *   ConsentBanner (only rendered with site.analytics.enabled; fixed at the
 *   bottom, z-50, early in the DOM so keyboard users reach it first) ·
 *   PromoBar (in flow, scrolls away) ·
 *   Header (sticky, z-30) · <main id="main"> · Footer ·
 *   EmailCapture (fixed pill bottom left, z-45; its modal is a portal, z-60) and
 *   CartDrawer (portal, z-60), both through a loader that mounts them once the
 *   page has settled (lib/hooks/useAfterLoad), so their code is not part of
 *   the initial JavaScript ·
 *   RouteFocus (renders nothing; moves focus to <main> after a client navigation
 *   when the focused link went away with the previous page) ·
 *   AnalyticsLoader (renders nothing unless analytics is on and accepted; then
 *   Google Tag Manager via next/script; only rendered with analytics on)
 *
 * Before all of it, two zero-size <svg>s: WordmarkDefs (the wordmark path
 * every wordmark uses) and StickDefs (the gradients every product render
 * shares). They come first so the first paint can use them.
 *
 * Pages render their content without their own <main>. No ancestor of the
 * header may set overflow, or `sticky` stops working.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Local modules only, so this resolves during prerender and every route stays static.
  // A remote provider (Shopify) must cache this call with 'use cache' (D18).
  const products = await commerce.getProducts();
  // Both render nothing with analytics off (the default); leaving them out also keeps their code out of the page.
  const analyticsEnabled = site.analytics.enabled;

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} antialiased`}>
      <head>
        {/*
          In <head> (React puts it after the stylesheet and the metadata), so it runs before any
          Suspense boundary is revealed. As an inline script after a stylesheet it also holds the
          parser until the CSS has loaded; the body is then parsed, styled and painted in one go,
          before the async scripts run. Measured: Lighthouse's simulated LCP no longer depends on
          whether React's chunk happened to run before the first paint (phase 8).
        */}
        <InstantReveal />
      </head>
      <body className="flex min-h-dvh flex-col bg-fog text-ink">
        {/* Shared SVG definitions first, so the header's wordmark and the renders in the first view paint complete. */}
        <WordmarkDefs />
        <StickDefs />
        <CatalogProvider products={products}>
          <CartProvider>
            <SkipLink />
            {analyticsEnabled ? <ConsentBanner /> : null}
            <PromoBar />
            <Header />
            {/* tabIndex -1: the skip link moves focus here; no ring on the whole page. */}
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
            <EmailCaptureLoader />
            <CartDrawerLoader />
            <RouteFocus />
            {analyticsEnabled ? <AnalyticsLoader /> : null}
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
