import { VideoSlot } from "@/components/media/VideoSlot";
import { Container } from "@/components/ui/Container";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

/**
 * "From CORVANE" (brief §6.10, docs/PLAN.md §4.9 and §14): a row of four 9:16
 * film slots from content/assets.ts (ugc-01 ... ugc-04), with titles from
 * home.videoRow.slots. Our own brand content: never framed as customers,
 * reviews or testimonials, and the note under the heading says so.
 *
 * - Mobile: a horizontal scroll-snap row that bleeds to the screen edge; the
 *   next card shows partly, so the row reads as scrollable. The list takes
 *   keyboard focus while it scrolls (ScrollRow; the placeholders hold nothing
 *   focusable), and only then.
 * - md: four columns under the heading, no scrolling.
 * - lg+: a split, like a magazine spread: heading, intro and note in the left
 *   4 columns (the note at the foot, level with the captions), the four films
 *   in the right 8. That keeps the slots small, so the row is not the
 *   largest dark mass on the page while it holds placeholders.
 *
 * VideoSlot renders the placeholder until a file is supplied, then a native
 * <video> with controls that never autoplays.
 */

export interface VideoRowProps {
  /** Hairline above the section, aligned to the container. For a fog section that follows another fog section. */
  divider?: boolean;
  className?: string;
}

export function VideoRow({ divider = false, className }: VideoRowProps) {
  const { id, label, heading, intro, note, slots, listLabel } = home.videoRow;
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div
          className={cn(
            "py-20 md:py-28 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:py-32",
            divider && "border-t border-line",
          )}
        >
          <div className="lg:col-span-4 lg:flex lg:flex-col">
            <SectionHeading id={headingId} eyebrow={label} title={heading} intro={intro} />
            <p className="mt-4 text-sm text-ink-soft md:mt-5 lg:mt-auto lg:pt-8">{note}</p>
          </div>

          <ScrollRow
            aria-label={listLabel}
            className={cn(
              "no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-1",
              "md:mx-0 md:mt-14 md:grid md:snap-none md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-0",
              "lg:col-span-8 lg:mt-0 lg:gap-4 xl:gap-5",
              "focus-visible:outline-offset-[-2px]",
            )}
          >
            {slots.map((slot, index) => (
              <li key={slot.id} className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto">
                <figure>
                  <VideoSlot assetKey={slot.id} label={slot.label} className="rounded-card" />
                  <figcaption className="mt-3 flex items-baseline gap-3 text-[0.9375rem] md:mt-4">
                    <span aria-hidden="true" className="tabular label-caps text-ink-soft">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-semibold text-ink">{slot.title}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ScrollRow>
        </div>
      </Container>
    </section>
  );
}
