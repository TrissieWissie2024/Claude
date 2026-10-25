import { VideoSlot } from "@/components/media/VideoSlot";
import { Container } from "@/components/ui/Container";
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
 *   keyboard focus (it scrolls, and the placeholders hold nothing focusable).
 * - md+: four columns inside the container, no scrolling.
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
        <div className={cn("py-20 md:py-28 lg:py-32", divider && "border-t border-line")}>
          <SectionHeading
            id={headingId}
            eyebrow={label}
            title={heading}
            intro={intro}
            action={<p className="text-sm text-ink-soft md:max-w-[16rem] md:text-right">{note}</p>}
          />

          <ul
            aria-label={listLabel}
            tabIndex={0}
            className={cn(
              "no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-1",
              "md:mx-0 md:mt-14 md:grid md:snap-none md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:mt-16 lg:gap-6",
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
          </ul>
        </div>
      </Container>
    </section>
  );
}
