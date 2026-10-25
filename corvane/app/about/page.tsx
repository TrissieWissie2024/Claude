import type { Metadata } from "next";
import Link from "next/link";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { ArrowRightIcon } from "@/components/home/icons";
import { PhotoSlot } from "@/components/media/PhotoSlot";
import { StickRender } from "@/components/media/StickRender";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Pill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pages, type PageSection } from "@/content/pages";
import { site } from "@/content/site";
import { findStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { commerce } from "@/lib/commerce";
import { pageMetadata } from "@/lib/seo";
import type { StickProduct } from "@/lib/types";

const copy = pages.about;

export const metadata: Metadata = pageMetadata({
  title: copy.meta.title,
  description: copy.meta.description,
  path: "/about",
});

/**
 * /about (docs/PLAN.md §1): the fictional brand story from content/pages.ts,
 * using only the facts in the brief (§3, §4): the North Sea coast, the name
 * (cor + vane), the idea (cologne without the bottle), how it is made, and
 * the six scents as small renders linking to their product pages.
 *
 * Photos are PhotoSlots: `story.coast` (the same slot as the homepage story
 * teaser, D41) and `products.north-swell.inHand`; both show a placeholder in
 * the same aspect ratio until real photos exist (docs/ASSETS.md). In the
 * hero the coast slot is a 5:4 frame on deep (a calm brand panel while it is
 * a placeholder), top-aligned with the heading, so the h1 sits as high as on
 * the other pages.
 *
 * Layout: an editorial grid. Each story section has a hairline, a small index
 * and its h2 on the left (4 columns from lg) and the text on the right at a
 * readable measure (36rem, about 65 characters per line at 18 px). The first
 * paragraph of each section is the lead. The six scents sit on a sand band at
 * the end, with the next index (05).
 */
export default async function AboutPage() {
  const products = await commerce.getProducts();
  const scents = copy.scents.slugs
    .map((slug) => findStick(products, slug))
    .filter((stick): stick is StickProduct => stick !== null);

  return (
    <>
      <Container className="pt-12 md:pt-16 lg:pt-20">
        <div className="grid gap-10 md:gap-12 lg:grid-cols-12 lg:items-start lg:gap-x-8">
          <SectionHeading
            level={1}
            eyebrow={copy.eyebrow}
            title={copy.h1}
            intro={copy.intro}
            eyebrowRule="neutral"
            className="lg:col-span-6"
          />
          <div className="relative aspect-[5/4] overflow-hidden rounded-card md:aspect-[16/10] lg:col-span-6 lg:aspect-[5/4] lg:w-full xl:col-span-5 xl:col-start-8">
            <PhotoSlot
              assetKey="story.coast"
              label={copy.photos.coast}
              aspect="fill"
              tone="deep"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
        </div>
      </Container>

      <Container className="pt-16 pb-4 md:pt-24 md:pb-8 lg:pt-28 lg:pb-12">
        {copy.sections.map((section, index) => (
          <StorySection key={section.id} section={section} index={index} />
        ))}
      </Container>

      <ScentsBand scents={scents} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Story sections                                                      */
/* ------------------------------------------------------------------ */

function StorySection({ section, index }: { section: PageSection; index: number }) {
  const headingId = `${section.id}-heading`;
  const [lead, ...rest] = section.body;
  const isName = section.id === "name";
  const isMade = section.id === "made";

  return (
    <section
      id={section.id}
      aria-labelledby={headingId}
      className={cn(
        "grid gap-6 border-t border-line py-12 md:gap-8 md:py-16 lg:grid-cols-12 lg:gap-x-8 lg:py-20",
        index === 0 && "pt-10 md:pt-14 lg:pt-16",
      )}
    >
      <div className="flex flex-col lg:col-span-4">
        <p aria-hidden="true" className="label-caps tabular text-ink-soft">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h2 id={headingId} className="mt-3 text-[1.75rem] leading-[1.12] md:text-[2.25rem] lg:text-[2.5rem]">
          {section.heading}
        </h2>
        {isName ? (
          // The vane, large and quiet: it turns with the wind but holds its point.
          <VaneIcon className="mt-10 hidden size-16 text-ink-soft/70 lg:block" />
        ) : null}
        {isMade ? (
          <div className="relative mt-10 hidden aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-card lg:block">
            <PhotoSlot
              assetKey="products.north-swell.inHand"
              label={copy.photos.product}
              aspect="fill"
              tone="sand"
              sizes="18rem"
            />
          </div>
        ) : null}
      </div>

      <div className="lg:col-span-7 lg:col-start-6">
        <div className="flex max-w-[36rem] flex-col gap-5">
          {lead ? (
            <p
              className={cn(
                "text-pretty text-ink",
                isName
                  ? "font-serif text-[1.375rem] leading-[1.2] tracking-[-0.01em] md:text-[1.5rem] lg:text-[1.75rem]"
                  : "text-lg leading-relaxed md:text-xl",
              )}
            >
              {lead}
            </p>
          ) : null}
          {rest.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-ink-soft md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        {isMade ? (
          <div className="mt-10 max-w-[36rem] border-t border-line pt-6">
            <p className="label-caps text-ink-soft">{copy.specsLabel}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {site.specs.map((spec) => (
                <li key={spec.id}>
                  <Pill tone="outline">{spec.label}</Pill>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {isMade ? (
          <div className="relative mt-10 aspect-[5/4] overflow-hidden rounded-card md:aspect-[16/10] lg:hidden">
            <PhotoSlot
              assetKey="products.north-swell.inHand"
              label={copy.photos.product}
              aspect="fill"
              tone="sand"
              sizes="100vw"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Six scents                                                          */
/* ------------------------------------------------------------------ */

function ScentsBand({ scents }: { scents: StickProduct[] }) {
  const band = copy.scents;
  const headingId = `${band.id}-heading`;
  const [lead, ...rest] = band.body;
  // The next index after the story sections (01-04), for the same rhythm.
  const index = String(copy.sections.length + 1).padStart(2, "0");

  return (
    <section id={band.id} aria-labelledby={headingId} className="bg-sand text-ink">
      <Container className="py-20 md:py-28 lg:py-32">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-12 lg:gap-x-8">
          <div className="flex flex-col lg:col-span-4">
            <p aria-hidden="true" className="label-caps tabular text-ink-soft">
              {index}
            </p>
            <h2 id={headingId} className="mt-3 text-[1.75rem] leading-[1.12] md:text-[2.25rem] lg:text-[2.5rem]">
              {band.heading}
            </h2>
          </div>
          <div className="flex max-w-[36rem] flex-col gap-4 lg:col-span-7 lg:col-start-6">
            {lead ? <p className="text-lg leading-relaxed text-ink md:text-xl">{lead}</p> : null}
            {rest.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-ink-soft md:text-lg">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <ul
          aria-label={copy.scentsListLabel}
          className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-16 md:gap-4 lg:grid-cols-6"
        >
          {scents.map((stick) => (
            <li key={stick.slug}>
              <Link
                href={`/products/${stick.slug}`}
                className="group flex h-full flex-col rounded-card bg-fog p-4 text-ink no-underline ring-1 ring-line ring-inset transition-shadow duration-200 hover:shadow-soft md:p-5"
              >
                <span className="flex h-40 items-end justify-center md:h-48">
                  <StickRender
                    ringColor={stick.ringColor}
                    className="h-[88%] w-auto motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-translate-y-1"
                  />
                </span>
                <span className="mt-5 flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full ring-1 ring-ink-soft"
                    style={{ backgroundColor: stick.ringColor }}
                  />
                  <span className="label-caps text-ink-soft">{stick.family}</span>
                </span>
                <span className="mt-1.5 font-serif text-[1.1875rem] leading-tight decoration-1 underline-offset-4 group-hover:underline">
                  {stick.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-12">
          <Button href={band.link.href} variant="primary" iconEnd={<ArrowRightIcon className="size-[18px]" />}>
            {band.link.label}
          </Button>
          <Button href={band.secondaryLink.href} variant="outline">
            {band.secondaryLink.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
