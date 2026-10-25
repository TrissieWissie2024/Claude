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
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { commerce } from "@/lib/commerce";

/**
 * Homepage (brief §6, docs/PLAN.md §4). A server component, fully static:
 * all data comes from local modules through `commerce`, and everything that
 * depends on the time or the cart (delivery bar, quick add) is a small client
 * island that renders same-height fallback text first.
 *
 * Section order follows PLAN §4. The promo bar, header and footer come from
 * app/layout.tsx; the email capture pill arrives in phase 7.
 *
 * Surfaces, top to bottom: deep hero · fog (delivery, range, how it works) ·
 * sand comparison · fog (finder, reviews, films) · kelp guarantee · fog (FAQ,
 * story). A fog section that follows another fog section gets `divider`, a
 * hairline aligned to the container.
 */
export default async function HomePage() {
  const products = await commerce.getProducts();

  return (
    <>
      <Hero products={products} />
      <DeliveryBar />
      <ProductGridSection />
      <HowItWorks divider />
      <SolidVsSpray />
      <ScentFinderPlaceholder />
      <ReviewsSection divider />
      <VideoRow divider />
      <GuaranteeBlock />
      <FaqSection items={faqItemsFor("home")} />
      <StoryTeaser divider />
    </>
  );
}

/**
 * Placeholder for the scent finder (PLAN §4.8). Phase 7 replaces it with
 * components/finder/ScentFinder (quiz from content/finder.ts). Until then only
 * the eyebrow and heading render, so the hero's "Find your scent" anchor
 * (#scent-finder) and the footer link land somewhere real, without promising
 * a quiz that is not there yet (the intro line waits for the quiz).
 */
function ScentFinderPlaceholder() {
  const { id, label, heading } = home.scentFinder;
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="bg-fog text-ink">
      <Container className="py-20 md:py-28 lg:py-32">
        <SectionHeading id={headingId} eyebrow={label} title={heading} />
      </Container>
    </section>
  );
}
