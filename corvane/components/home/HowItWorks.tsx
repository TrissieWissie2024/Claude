import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

import { stepIcons } from "./icons";

/**
 * How it works (brief §6.7, docs/PLAN.md §4.6): three steps from
 * home.howItWorks, each with its own line icon (components/home/icons.tsx),
 * a number, a short title and one line.
 *
 * Mobile: stacked rows, icon left, hairline between steps.
 * md+: three columns on a shared hairline, number left, icon right.
 * The numbers are decorative; the <ol> carries the order.
 */

export interface HowItWorksProps {
  /** Hairline above the section, aligned to the container. For a fog section that follows another fog section. */
  divider?: boolean;
  className?: string;
}

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function HowItWorks({ divider = false, className }: HowItWorksProps) {
  const { id, label, heading, intro, steps } = home.howItWorks;
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div className={cn("py-20 md:py-28 lg:py-32", divider && "border-t border-line")}>
          <SectionHeading id={headingId} eyebrow={label} title={heading} intro={intro} />

          <ol className="mt-12 md:mt-16 md:grid md:grid-cols-3 md:gap-8 lg:mt-20 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.id];
              return (
                <li
                  key={step.id}
                  className="flex gap-5 border-t border-line py-7 last:border-b md:flex-col md:gap-0 md:pt-7 md:pb-0 md:last:border-b-0"
                >
                  <div className="flex shrink-0 md:mb-8 md:items-center md:justify-between lg:mb-10">
                    <span
                      aria-hidden="true"
                      className="tabular label-caps hidden text-ink-soft md:block"
                    >
                      {stepNumber(index)}
                    </span>
                    <span className="flex size-14 items-center justify-center rounded-full bg-sand text-ink md:size-16">
                      <Icon className="size-7 md:size-8" />
                    </span>
                  </div>
                  <div className="min-w-0 pt-1 md:pt-0">
                    <span aria-hidden="true" className="tabular label-caps block text-ink-soft md:hidden">
                      {stepNumber(index)}
                    </span>
                    <h3 className="mt-1.5 text-[1.625rem] leading-[1.1] md:mt-0 md:text-[2rem]">{step.title}</h3>
                    <p className="mt-2 max-w-[22rem] text-base leading-relaxed text-ink-soft md:mt-3">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
