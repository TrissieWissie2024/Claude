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
import { ArrowRightIcon } from "@/components/home/icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { commerce } from "@/lib/commerce";

/**
 * Homepage (brief §6, docs/PLAN.md §4). A server component, fully static:
 * all data comes from local modules through `commerce` (fetched once here and
 * passed down), and everything that depends on the time or the cart (delivery
 * bar, quick add, the grid's sort state) is a small client island; the
 * time-dependent ones render same-height fallback text first.
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
      <ProductGridSection catalog={products} />
      <HowItWorks products={products} divider />
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
 * Stand-in for the scent finder (PLAN §4.8, D38) until phase 7 replaces it
 * with components/finder/ScentFinder (quiz from content/finder.ts). The hero's
 * "Find your scent" anchor (#scent-finder) and the footer link land on
 * something to do now: one line and a link to the Discovery Set
 * (home.scentFinder.interim). The quiz intro ("Three questions, one
 * suggestion.") waits for the quiz, so nothing here promises it.
 *
 * Phones: stacked. lg+: heading left, the line and the link right, on the
 * heading's baseline.
 */
function ScentFinderPlaceholder() {
  const { id, label, heading, interim } = home.scentFinder;
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="bg-fog text-ink">
      <Container className="grid gap-6 py-20 md:gap-8 md:py-28 lg:grid-cols-12 lg:items-end lg:gap-x-8 lg:py-32">
        <SectionHeading id={headingId} eyebrow={label} title={heading} className="lg:col-span-6" />
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6 lg:col-span-6 lg:justify-end lg:pb-1">
          <p className="text-base leading-relaxed text-ink-soft md:text-lg">{interim.text}</p>
          <Button href={interim.link.href} variant="outline" iconEnd={<ArrowRightIcon className="size-[18px]" />}>
            {interim.link.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
