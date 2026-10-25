import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

import { FinderQuiz } from "./FinderQuiz";
import { finderTones, type FinderTone } from "./tones";

/**
 * Homepage section 8, the scent finder (brief §6.9, docs/PLAN.md §4, D23).
 * A server component: eyebrow, h2 and intro come from home.scentFinder and
 * are static HTML; only the quiz panel (FinderQuiz) is a client island. Its
 * first question is in the static HTML too, and the panel keeps one minimum
 * height for every step, so neither hydration nor the steps shift the page.
 *
 * Keeps `id="scent-finder"` (home.scentFinder.id), the target of the hero's
 * "Find your scent" anchor and the footer link. Homepage rhythm (D37): 80 /
 * 112 / 128 px above and below. Phones and tablets: heading over the panel.
 * From lg: heading left (4 of 12 columns, 5 from xl), panel right.
 *
 * `tone`: "deep" (default) or "sand". The section brings its own background;
 * a fog section directly after it needs no divider.
 */

export interface ScentFinderProps {
  tone?: FinderTone;
  /** Section id. Default home.scentFinder.id ("scent-finder"). */
  id?: string;
  className?: string;
}

export function ScentFinder({ tone = "deep", id = home.scentFinder.id, className }: ScentFinderProps) {
  const copy = home.scentFinder;
  const t = finderTones[tone];
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("relative isolate overflow-hidden", t.section, className)}>
      {t.glow ? <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10", t.glow)} /> : null}
      <Container className="grid gap-10 py-20 md:gap-12 md:py-28 lg:grid-cols-12 lg:gap-x-8 lg:py-32">
        <SectionHeading
          id={headingId}
          eyebrow={copy.label}
          title={copy.heading}
          intro={copy.intro}
          tone={t.heading}
          className="lg:col-span-4 lg:pt-2 xl:col-span-5"
        />
        <FinderQuiz tone={tone} className="lg:col-span-8 xl:col-span-7" />
      </Container>
    </section>
  );
}
