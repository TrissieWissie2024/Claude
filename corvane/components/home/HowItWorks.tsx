import { SLOT_TONES } from "@/components/media/PhotoSlot";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { findStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { commerce } from "@/lib/commerce";
import type { Product } from "@/lib/types";

import { StepRender } from "./StepRender";

/**
 * How it works (brief §6.7, docs/PLAN.md §4.6): three steps from
 * home.howItWorks, each shown with the product itself (StepRender: the same
 * stick as the hero and the cards, in the ring colour of
 * home.howItWorks.renderScent) on a sand tile, then a number, a short title
 * and one line.
 *
 * The heading is the page's one centred display line ("Twist. Swipe. Go.",
 * SectionHeading size "display"), so the section breaks the run of
 * left-aligned openers.
 *
 * Mobile: stacked rows, a 4:5 tile left and the text beside it.
 * md+: three centred columns, a 4:3 tile on top.
 * The numbers are decorative; the <ol> carries the order.
 */

export interface HowItWorksProps {
  /** The catalog; fetched from `commerce` when left out. */
  products?: readonly Product[];
  /** Hairline above the section, aligned to the container. For a fog section that follows another fog section. */
  divider?: boolean;
  className?: string;
}

/** Ring colour if the scent is missing from the catalog: North Swell's, from the brief. */
const FALLBACK_RING = "#6FA8C7";

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export async function HowItWorks({ products, divider = false, className }: HowItWorksProps) {
  const { id, label, heading, intro, steps, renderScent } = home.howItWorks;
  const headingId = `${id}-heading`;
  const catalog = products ?? (await commerce.getProducts());
  const ringColor = findStick(catalog, renderScent)?.ringColor ?? FALLBACK_RING;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div className={cn("py-20 md:py-28 lg:py-32", divider && "border-t border-line")}>
          <SectionHeading id={headingId} eyebrow={label} title={heading} intro={intro} align="center" size="display" />

          <ol className="mt-12 flex flex-col gap-8 md:mt-16 md:grid md:grid-cols-3 md:gap-6 lg:mt-20 lg:gap-8">
            {steps.map((step, index) => (
              <li key={step.id} className="flex items-center gap-5 md:flex-col md:items-stretch md:gap-0 md:text-center">
                <div
                  className="relative aspect-[4/5] w-[6.5rem] shrink-0 overflow-hidden rounded-card md:aspect-[4/3] md:w-full"
                  style={{ backgroundImage: SLOT_TONES.sand.background }}
                >
                  <StepRender
                    step={step.id}
                    ringColor={ringColor}
                    className="absolute inset-x-0 inset-y-[8%] h-[84%] w-full"
                  />
                </div>
                <div className="min-w-0 md:mt-7 lg:mt-8">
                  <span aria-hidden="true" className="tabular label-caps block text-ink-soft">
                    {stepNumber(index)}
                  </span>
                  <h3 className="mt-1.5 text-[1.625rem] leading-[1.1] md:mt-2 md:text-[2rem]">{step.title}</h3>
                  <p className="mt-2 max-w-[22rem] text-base leading-relaxed text-ink-soft md:mx-auto md:mt-3">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
