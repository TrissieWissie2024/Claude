import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { EmailCapture } from "@/components/email/EmailCapture";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PromoBar } from "@/components/layout/PromoBar";
import { RouteFocus } from "@/components/layout/RouteFocus";
import { SkipLink } from "@/components/layout/SkipLink";
import { StickDefs } from "@/components/media/StickRender";
import { commerce } from "@/lib/commerce";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CORVANE | Solid cologne. Scent with direction.",
    template: "%s | CORVANE",
  },
  description:
    "Solid cologne in a 15 g twist-up stick. Six original scents, alcohol-free, plant-based wax.",
};

export const viewport: Viewport = {
  themeColor: "#0F2733",
};

/**
 * Root layout (docs/PLAN.md §2, §10). A server component; the chrome around
 * every page, in DOM order:
 *   SkipLink (z-70, only visible on focus) · PromoBar (in flow, scrolls away) ·
 *   Header (sticky, z-30) · <main id="main"> · Footer ·
 *   EmailCapture (fixed pill bottom left, z-45; its modal is a portal, z-60) ·
 *   CartDrawer (portal, z-60) ·
 *   RouteFocus (renders nothing; moves focus to <main> after a client navigation
 *   when the focused link went away with the previous page) ·
 *   StickDefs (a zero-size <svg> with the gradients every product render shares)
 *
 * Pages render their content without their own <main>. No ancestor of the
 * header may set overflow, or `sticky` stops working.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Local modules only, so this resolves during prerender and every route stays static.
  // A remote provider (Shopify) must cache this call with 'use cache' (D18).
  const products = await commerce.getProducts();

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col bg-fog text-ink">
        <CatalogProvider products={products}>
          <CartProvider>
            <SkipLink />
            <PromoBar />
            <Header />
            {/* tabIndex -1: the skip link moves focus here; no ring on the whole page. */}
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
            <EmailCapture />
            <CartDrawer />
            <RouteFocus />
          </CartProvider>
        </CatalogProvider>
        <StickDefs />
      </body>
    </html>
  );
}
