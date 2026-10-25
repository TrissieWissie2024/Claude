"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { DESKTOP_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from "@/components/layout/promo/useMediaQuery";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";

/**
 * Product gallery (brief §6, docs/PLAN.md §9): packshot render, in-hand photo
 * slot, notes card (sticks) and lifestyle photo slot, each a fixed 4:5 slide.
 *
 * One scroll-snap track serves every width, so each slide exists once in the
 * DOM and the first one is server-rendered in view (no layout shift):
 * - Phones and tablets (below lg): swipe (scroll snap, one slide per swipe),
 *   dot buttons under the image and a polite "Image 1 of 4" status for screen
 *   readers. The track takes keyboard focus there, so arrow keys scroll it.
 * - lg+: the large image with a column of thumbnail buttons on its left
 *   (aria-label "Show image 2 of 4", aria-current on the shown one; one Tab
 *   stop, arrow keys, Home and End move between them) and previous/next
 *   buttons on the image. The track does not scroll by hand there; the
 *   buttons scroll it.
 *
 * Slides and thumbnails arrive as server-rendered nodes, so the renders and
 * the content modules stay out of the client bundle. Smooth scrolling only
 * with motion allowed.
 */

export interface GallerySlide {
  /** Stable key, e.g. "packshot". */
  id: string;
  /** Accessible name of the slide, e.g. "North Swell in the hand". */
  label: string;
  /** The slide; it fills a positioned 4:5 box. */
  content: ReactNode;
  /** Thumbnail; it fills a positioned 4:5 box. Defaults to `content`. */
  thumb?: ReactNode;
}

export interface ProductGalleryProps {
  slides: GallerySlide[];
  /** Accessible name of the gallery. Default "Product images". */
  label?: string;
  className?: string;
}

/** Time without scroll events after which a swipe counts as settled. */
const SETTLE_MS = 70;

export function ProductGallery({ slides, label = pdp.gallery.label, className }: ProductGalleryProps) {
  const total = slides.length;
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState(() => pdp.galleryStatus(1, total));
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  useEffect(() => {
    const timer = settleTimer;
    return () => clearTimeout(timer.current);
  }, []);

  const select = (index: number) => {
    setActive(index);
    setStatus(pdp.galleryStatus(index + 1, total));
  };

  const show = (index: number) => {
    const next = Math.max(0, Math.min(total - 1, index));
    select(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
  };

  // Follows swipes: once the track settles, the slide in view becomes the active one.
  const handleScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const index = Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (index !== active) select(index);
    }, SETTLE_MS);
  };

  const handleThumbKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    let next: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = Math.min(total - 1, active + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = Math.max(0, active - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = total - 1;
    if (next === null) return;
    event.preventDefault();
    show(next);
    thumbRefs.current[next]?.focus();
  };

  if (total === 0) return null;

  const atStart = active === 0;
  const atEnd = active === total - 1;

  return (
    <section aria-roledescription="carousel" aria-label={label} className={className}>
      <div className="lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[5rem_minmax(0,1fr)] xl:gap-5">
        {/* Thumbnails (lg+): one Tab stop, arrow keys move between them. */}
        {total > 1 ? (
          <ul role="list" className="hidden lg:flex lg:flex-col lg:gap-3" onKeyDown={handleThumbKeyDown}>
            {slides.map((slide, index) => {
              const current = index === active;
              return (
                <li key={slide.id}>
                  <button
                    ref={(node) => {
                      thumbRefs.current[index] = node;
                    }}
                    type="button"
                    tabIndex={current ? 0 : -1}
                    aria-label={pdp.gallery.thumbnail(index + 1, total)}
                    aria-current={current ? "true" : undefined}
                    onClick={() => show(index)}
                    className={cn(
                      "relative block aspect-[4/5] w-full overflow-hidden rounded-[10px]",
                      "motion-safe:transition-[box-shadow,opacity] motion-safe:duration-200",
                      // Selected: a 2 px ink ring with a gap, not only a change of opacity.
                      current
                        ? "ring-2 ring-ink ring-offset-2 ring-offset-fog"
                        : "opacity-70 ring-1 ring-line hover:opacity-100",
                    )}
                  >
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                      {slide.thumb ?? slide.content}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className={cn("relative", total <= 1 && "lg:col-span-2")}>
          <div
            ref={trackRef}
            onScroll={handleScroll}
            // Focusable where it scrolls by hand (below lg), so arrow keys scroll it.
            tabIndex={isDesktop || total <= 1 ? undefined : 0}
            aria-label={isDesktop ? undefined : label}
            className={cn(
              "no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:rounded-card",
              "lg:overflow-x-hidden",
              "focus-visible:outline-offset-[-4px]",
            )}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={slide.label}
                className="relative aspect-[4/5] w-full shrink-0 snap-start snap-always overflow-hidden"
                data-index={index}
              >
                {slide.content}
              </div>
            ))}
          </div>

          {/* Previous / next (lg+). aria-disabled at the ends keeps the focus on the button. */}
          {total > 1 ? (
            <div className="absolute right-4 bottom-4 hidden gap-2 lg:flex">
              <GalleryButton label={pdp.gallery.previous} disabled={atStart} onClick={() => show(active - 1)}>
                <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </GalleryButton>
              <GalleryButton label={pdp.gallery.next} disabled={atEnd} onClick={() => show(active + 1)}>
                <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </GalleryButton>
            </div>
          ) : null}
        </div>
      </div>

      {/* Dots (below lg): 6 px marks with a 24 px hit area. */}
      {total > 1 ? (
        <div className="mt-3 flex justify-center lg:hidden">
          {slides.map((slide, index) => {
            const current = index === active;
            return (
              <button
                key={slide.id}
                type="button"
                aria-label={pdp.gallery.thumbnail(index + 1, total)}
                aria-current={current ? "true" : undefined}
                onClick={() => show(index)}
                className="group flex h-6 min-w-6 items-center justify-center px-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1.5 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-200",
                    "forced-color-adjust-none",
                    current
                      ? "w-5 bg-ink forced-colors:bg-[CanvasText]"
                      : "w-1.5 bg-ink/25 group-hover:bg-ink/50 forced-colors:bg-[GrayText]",
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </p>
    </section>
  );
}

function GalleryButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border border-transparent bg-fog/95 text-ink shadow-soft",
        "motion-safe:transition-[background-color,opacity] motion-safe:duration-200",
        disabled ? "cursor-default opacity-45" : "hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
