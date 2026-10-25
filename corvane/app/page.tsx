import type { Metadata } from "next";

import { ScentFinder } from "@/components/finder/ScentFinder";
import { DeliveryBar } from "@/components/home/DeliveryBar";
import { FaqSection, faqItemsFor } from "@/components/home/FaqSection";
import { GuaranteeBlock } from "@/components/home/GuaranteeBlock";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProductGridSection } from "@/components/home/ProductGridSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { SolidVsSpray } from "@/components/home/SolidVsSpray";
import { StoryTeaser } from "@/components/home/StoryTeaser";
import { VideoRow } from "@/components/home/VideoRow";
import { JsonLd } from "@/components/seo/JsonLd";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { commerce } from "@/lib/commerce";
import { homeJsonLd, pageMetadata } from "@/lib/seo";

/**
 * The root template ("%s | CORVANE") does not apply to a page in the root
 * segment, so the title is absolute: "CORVANE | Solid cologne in a twist-up stick".
 */
export const metadata: Metadata = pageMetadata({
  title: { absolute: `${site.name} | ${home.meta.title}` },
  description: home.meta.description,
  path: "/",
});

/**
 * Homepage (brief §6, docs/PLAN.md §4). A server component, fully static:
 * all data comes from local modules through `commerce` (fetched once here and
 * passed down), and everything that depends on the time or the cart (delivery
 * bar, quick add, the grid's sort state) is a small client island; the
 * time-dependent ones render same-height fallback text first.
 *
 * Section order follows PLAN §4. The promo bar, header, footer and the email
 * capture pill come from app/layout.tsx.
 *
 * Surfaces, top to bottom: deep hero · fog (delivery, range, how it works) ·
 * sand comparison · deep scent finder · fog (reviews, films) · kelp guarantee ·
 * fog (FAQ, story). A fog section that follows another fog section gets
 * `divider`, a hairline aligned to the container.
 */
export default async function HomePage() {
  const products = await commerce.getProducts();

  return (
    <>
      {/* Organization and WebSite (lib/seo.ts). No sameAs while the social links are placeholders. */}
      <JsonLd data={homeJsonLd()} />
      <Hero products={products} />
      <DeliveryBar />
      <ProductGridSection catalog={products} />
      <HowItWorks products={products} divider />
      <SolidVsSpray />
      <ScentFinder />
      <ReviewsSection />
      <VideoRow divider />
      <GuaranteeBlock />
      <FaqSection items={faqItemsFor("home")} />
      <StoryTeaser divider />
    </>
  );
}
