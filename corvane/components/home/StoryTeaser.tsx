import { PhotoSlot } from "@/components/media/PhotoSlot";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

import { ArrowRightIcon } from "./icons";

/**
 * Brand story teaser (brief §3 and §6.11, docs/PLAN.md §4.12): the North Sea
 * coast origin in two short paragraphs, the name as a small dictionary entry
 * (Cor + vane, with the pronunciation), the tagline, and a link to /about.
 *
 * The photo is the `story.coast` slot from content/assets.ts: a 4:5 PhotoSlot
 * placeholder ("PHOTO: North Sea coast, dunes ...") until real photography
 * exists. Photo first on mobile; on lg+ photo left
 * (5 columns), text right.
 */

export interface StoryTeaserProps {
  /** Hairline above the section, aligned to the container. For a fog section that follows another fog section. */
  divider?: boolean;
  className?: string;
}

export function StoryTeaser({ divider = false, className }: StoryTeaserProps) {
  const { id, label, heading, paragraphs, photoLabel, link, name, tagline } = home.story;
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div
          className={cn(
            "grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-32",
            divider && "border-t border-line",
          )}
        >
          <PhotoSlot
            assetKey="story.coast"
            label={photoLabel}
            aspect="4:5"
            tone="sand"
            className="rounded-card lg:col-span-5"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />

          <div className="lg:col-span-6 lg:col-start-7">
            <SectionHeading id={headingId} eyebrow={label} title={heading} />

            <div className="mt-6 flex max-w-[34rem] flex-col gap-4 text-base leading-relaxed text-ink-soft md:mt-8 md:text-lg">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-10 max-w-[34rem] border-y border-line py-6 md:mt-12">
              <p className="label-caps text-ink-soft">{name.label}</p>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-serif text-[1.625rem] leading-none tracking-[0.12em]">{name.word}</span>
                <span className="text-[0.9375rem] text-ink-soft">
                  <span className="sr-only">{name.pronunciationLabel} </span>
                  <span aria-hidden="true">/</span>
                  {name.pronunciation}
                  <span aria-hidden="true">/</span>
                </span>
              </p>
              <dl className="mt-5 grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 text-[0.9375rem] leading-relaxed">
                {name.parts.map((part) => (
                  <div key={part.id} className="contents">
                    <dt className="font-serif text-lg leading-[1.45] text-ink">{part.term}</dt>
                    <dd className="text-ink-soft">{part.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between md:mt-12 lg:max-w-[34rem]">
              <Button href={link.href} variant="outline" iconEnd={<ArrowRightIcon className="size-[18px]" />}>
                {link.label}
              </Button>
              <p className="font-serif text-lg text-ink-soft">{tagline}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
