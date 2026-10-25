import { ArrowDown, DropletOff, RotateCw, type LucideIcon } from "lucide-react";

import { GroupRender, type GroupScent } from "@/components/media/GroupRender";
import { PhotoSlot } from "@/components/media/PhotoSlot";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { assets } from "@/content/assets";
import { home } from "@/content/home";
import { findStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { commerce } from "@/lib/commerce";
import { getRatingSummary } from "@/lib/reviews";
import type { Product, StickProduct } from "@/lib/types";

/**
 * Homepage hero (brief §6.3, docs/PLAN.md §4 and §14). Server component, no
 * client JS: deep background, the page's only h1, subheading, two spec pills,
 * the primary CTA to the shop and a secondary one to the scent finder.
 *
 * - Media: the hero.group photo from content/assets.ts once it is supplied,
 *   otherwise the inline SVG GroupRender of home.hero.groupScents. Either way
 *   in a fixed 4:5 box, so nothing shifts. The h1 is the LCP candidate.
 * - Rating line only with real reviews (getRatingSummary() is null at launch,
 *   so nothing renders, not even an empty slot).
 * - Phones: text first, so the h1 and both CTAs are above the fold at
 *   390 x 844 with the sticks rising into view below. From md: two columns.
 */

export interface HeroProps {
  /** The catalog; fetched from `commerce` when left out. */
  products?: readonly Product[];
  className?: string;
}

/** Decorative icons for the spec pills, by spec id (content/site.ts specs). */
const PILL_ICONS: Partial<Record<string, LucideIcon>> = {
  "twist-up": RotateCw,
  "alcohol-free": DropletOff,
};

export async function Hero({ products, className }: HeroProps) {
  const catalog = products ?? (await commerce.getProducts());
  const scents: GroupScent[] = home.hero.groupScents
    .map((slug) => findStick(catalog, slug))
    .filter((stick): stick is StickProduct => stick !== null);
  const rating = getRatingSummary();
  const photo = assets.hero.group;
  const copy = home.hero;
  const headingId = `${copy.id}-heading`;

  return (
    <section
      id={copy.id}
      aria-labelledby={headingId}
      className={cn("focus-on-dark relative isolate overflow-hidden bg-deep text-fog", className)}
    >
      {/* A faint pool of light behind the sticks: under the text on phones, to the right from md. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10",
          "bg-[radial-gradient(85%_42%_at_50%_80%,rgb(30_72_94/0.5),transparent_72%)]",
          "md:bg-[radial-gradient(48%_70%_at_77%_52%,rgb(30_72_94/0.55),transparent_72%)]",
        )}
      />

      <Container className="grid grid-cols-1 gap-y-4 pt-10 pb-8 md:grid-cols-12 md:items-center md:gap-x-6 md:py-16">
        <div className="md:col-span-7">
          <p className="label-caps flex items-center gap-3 text-mist">
            <span aria-hidden="true" className="h-px w-6 bg-signal" />
            {copy.eyebrow}
          </p>

          {rating ? (
            <a href="#reviews" className="mt-5 inline-flex rounded-full">
              <Stars rating={rating} tone="dark" />
            </a>
          ) : null}

          <h1
            id={headingId}
            className="mt-5 max-w-[14ch] text-[clamp(2.5rem,11.25vw,2.75rem)] leading-[1.02] tracking-[-0.02em] text-fog md:mt-6 md:text-[3rem] lg:text-[4.25rem] xl:text-[4.875rem]"
          >
            {copy.heading}
          </h1>

          {/* Width and size chosen so the line breaks after the first sentence ("... twist-up stick.") from 360 px up. */}
          <p className="mt-5 max-w-[22rem] text-[1.0625rem] leading-relaxed text-mist max-[374px]:text-base md:mt-6 md:max-w-[23rem] md:text-lg">
            {copy.subheading}
          </p>

          <ul aria-label={copy.pillsLabel} className="mt-6 flex flex-wrap gap-2 md:mt-8">
            {copy.pills.map((pill) => {
              const Icon = PILL_ICONS[pill.id];
              return (
                <li key={pill.id}>
                  <Pill
                    tone="outline-on-dark"
                    className="bg-fog/[0.04]"
                    icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : undefined}
                  >
                    {pill.label}
                  </Pill>
                </li>
              );
            })}
          </ul>

          {/*
            Side by side from 375 px (tighter padding below 390 px); stacked at
            full width on narrower phones, so they never wrap unevenly. Large
            buttons from lg.
          */}
          <div className="mt-8 flex flex-wrap items-center gap-2.5 max-[374px]:flex-col max-[374px]:items-stretch md:mt-10 md:gap-3">
            <Button
              href={copy.primaryCta.href}
              variant="primary"
              className="max-[389px]:px-4 min-[390px]:max-md:px-5 lg:h-14 lg:px-8 lg:text-base"
            >
              {copy.primaryCta.label}
            </Button>
            <Button
              href={copy.secondaryCta.href}
              variant="outline-on-dark"
              iconEnd={<ArrowDown aria-hidden="true" className="size-4" strokeWidth={1.75} />}
              className="max-[389px]:px-4 min-[390px]:max-md:px-5 lg:h-14 lg:px-7 lg:text-base"
            >
              {copy.secondaryCta.label}
            </Button>
          </div>
        </div>

        <div className="md:col-span-5">
          {/* Fixed 4:5 box (the render's and the photo slot's ratio): no layout shift. */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[20rem] sm:max-w-[24rem] md:max-w-none">
            {photo.src ? (
              <PhotoSlot
                assetKey={photo.key}
                label={photo.label}
                aspect="fill"
                tone="deep"
                priority
                sizes="(min-width: 1280px) 480px, (min-width: 768px) 40vw, 90vw"
                className="rounded-card"
              />
            ) : (
              <GroupRender scents={scents} className="absolute inset-0 h-full w-full" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
