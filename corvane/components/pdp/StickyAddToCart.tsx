"use client";

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";

import { DESKTOP_QUERY, useMediaQuery } from "@/components/layout/promo/useMediaQuery";
import { Button } from "@/components/ui/Button";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";

/**
 * Mobile sticky add-to-cart bar (docs/PLAN.md §9, §10). Below lg only.
 *
 * - Shows once the main Add to cart button (`targetRef`) has scrolled out of
 *   view above the viewport (under the sticky header counts as out of view),
 *   via IntersectionObserver. Hidden while the main button is visible, while
 *   it is still below the fold, and so always at the very top of the page.
 * - Fixed to the bottom, z-40 (above the header at 30, below the email pill
 *   at 45 and the drawers at 60), with env(safe-area-inset-bottom) padding.
 *   Slides in with motion-safe only. While hidden it is `invisible` and
 *   inert, so it is never focusable or read out.
 * - While visible: document.body.dataset.stickyAtc = "true" (the email pill
 *   hides itself and does not open on its own, PLAN §10), the body gets a
 *   bottom padding of the bar's height (so the end of the footer can always
 *   be scrolled clear of the bar), <html> gets a scroll-padding-bottom of the
 *   bar's height plus a margin (so an element that gets keyboard focus is
 *   scrolled in above the bar, never under it) and a `corvane:sticky-atc` window event
 *   with `{ visible: boolean }` is dispatched on every change. All of these are
 *   removed when the bar hides or unmounts (also when Activity hides the
 *   route). Several bars at once (a hidden previous route) are counted, so
 *   one hiding never clears the flag of another.
 */

/* ------------------------------------------------------------------ */
/* Shared button label                                                 */
/* ------------------------------------------------------------------ */

/**
 * "Add to cart · €59.95". The dot is aria-hidden, so the accessible name is
 * "Add to cart €59.95" (the visible label starts with the same words, WCAG 2.5.3).
 */
export function AddToCartLabel({ price }: { price: string }) {
  return (
    <>
      {/* The spaces keep the words apart in the accessible name; flex ignores them visually. */}
      <span>{pdp.addToCart.label}</span>{" "}
      <span aria-hidden="true" className="opacity-70">
        {pdp.addToCart.separator}
      </span>{" "}
      <span className="tabular">{price}</span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Body flag                                                           */
/* ------------------------------------------------------------------ */

export const STICKY_ATC_EVENT = "corvane:sticky-atc";

export interface StickyAtcEventDetail {
  visible: boolean;
}

/** Heights of the bars that are visible right now, by registration. */
const visibleBars = new Map<symbol, number>();

/** Space kept clear above the bar when the browser scrolls a focused element into view. */
const FOCUS_CLEARANCE_PX = 12;

function syncBody(): void {
  const body = document.body;
  const root = document.documentElement;
  const visible = visibleBars.size > 0;
  if (visible) {
    const height = Math.max(...visibleBars.values());
    body.dataset.stickyAtc = "true";
    body.style.paddingBottom = `${height}px`;
    // Keyboard focus scrolled in from below stops above the bar, not under it (WCAG 2.4.11).
    root.style.scrollPaddingBottom = `${height + FOCUS_CLEARANCE_PX}px`;
  } else {
    delete body.dataset.stickyAtc;
    body.style.removeProperty("padding-bottom");
    root.style.removeProperty("scroll-padding-bottom");
  }
  window.dispatchEvent(new CustomEvent<StickyAtcEventDetail>(STICKY_ATC_EVENT, { detail: { visible } }));
}

/**
 * Marks one bar as visible and keeps the body padding equal to its height
 * (the summary can wrap to a second line on narrow phones). Returns the cleanup.
 */
function registerVisibleBar(bar: HTMLElement): () => void {
  const key = Symbol("sticky-atc");
  visibleBars.set(key, bar.offsetHeight);
  syncBody();
  const resize =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          if (!visibleBars.has(key) || visibleBars.get(key) === bar.offsetHeight) return;
          visibleBars.set(key, bar.offsetHeight);
          syncBody();
        });
  resize?.observe(bar);
  return () => {
    resize?.disconnect();
    visibleBars.delete(key);
    syncBody();
  };
}

/* ------------------------------------------------------------------ */
/* Bar                                                                 */
/* ------------------------------------------------------------------ */

export interface StickyAddToCartProps {
  /** The main Add to cart button, or the element that wraps it. */
  targetRef: RefObject<HTMLElement | null>;
  /** Scent or product name. */
  title: string;
  /**
   * e.g. ["3 sticks", "Every 2 months"]. Parts are joined with a dot and
   * never break inside, so on a narrow phone the line wraps between parts.
   */
  summary: string | readonly string[];
  /** Formatted total for the button, e.g. "€59.95". */
  price: string;
  onAdd: () => void;
  /** Ring colour dot before the title (sticks). */
  ringColor?: string;
  /** One dot per stick of a mixed set, in set order; replaces `ringColor`. */
  ringColors?: readonly string[];
  /** Screen reader text for the title line when it differs from `title` (a mixed set names its scents). */
  titleLabel?: string;
}

function headerHeight(): number {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
  return Number.isFinite(value) ? value : 64;
}

export function StickyAddToCart({
  targetRef,
  title,
  summary,
  price,
  onAdd,
  ringColor,
  ringColors,
  titleLabel,
}: StickyAddToCartProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [passed, setPassed] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const visible = passed && !isDesktop;
  const parts = typeof summary === "string" ? [summary] : summary;
  const dots = ringColors && ringColors.length > 0 ? ringColors : ringColor ? [ringColor] : [];

  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const top = headerHeight();
    // The observed area runs from the bottom of the sticky header down past the end of any page
    // (a bottom margin of 100000 px), so its only edge is the header line. A jump straight past
    // the button (End key, an anchor link, scroll restored on reload) crosses that edge and is
    // reported too; with the plain viewport, "below the fold" to "above the fold" crosses no
    // threshold and the bar would not show.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const viewTop = entry.rootBounds?.top ?? top;
        setPassed(!entry.isIntersecting && entry.boundingClientRect.bottom <= viewTop + 1);
      },
      { rootMargin: `-${top}px 0px 100000px 0px`, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  useEffect(() => {
    const bar = barRef.current;
    if (!visible || !bar) return;
    return registerVisibleBar(bar);
  }, [visible]);

  return (
    <div
      ref={barRef}
      role="region"
      aria-label={pdp.stickyBar.label}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-fog shadow-[0_-8px_24px_rgb(16_20_24/0.06)] lg:hidden",
        "motion-safe:transition-[translate,visibility] motion-safe:duration-300 motion-safe:ease-out",
        visible ? "visible translate-y-0" : "invisible translate-y-full",
      )}
    >
      {/*
        One row. With a large default font size the text column would drop under 4.5rem, so the
        row wraps: the text takes the full width and the button moves under it (at 16 px it never
        wraps, down to 320 px).
      */}
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-8">
        <div className="min-w-[4.5rem] flex-1">
          <p className="flex items-center gap-2 font-serif text-base leading-5 text-ink">
            {dots.length > 0 ? (
              <span aria-hidden="true" className="flex shrink-0 items-center gap-1">
                {dots.map((color, index) => (
                  <span
                    key={`${index}-${color}`}
                    className="inline-block size-2.5 rounded-full ring-1 ring-ink-soft"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
            ) : null}
            {/* Wraps between words instead of truncating: a 320 px screen or large text never cuts the name off. */}
            <span aria-hidden={titleLabel ? true : undefined} className="min-w-0">
              {title}
            </span>
            {titleLabel ? <span className="sr-only">{titleLabel}</span> : null}
          </p>
          <p className="mt-0.5 text-xs leading-4 text-ink-soft">
            {parts.map((part, index) => (
              <Fragment key={`${index}-${part}`}>
                {/* The spaces around the dot are the only places the line may wrap. */}
                {index > 0 ? <span aria-hidden="true">{` ${pdp.addToCart.separator} `}</span> : null}
                {index > 0 ? <span className="sr-only">, </span> : null}
                <span className="whitespace-nowrap">{part}</span>
              </Fragment>
            ))}
          </p>
        </div>
        {/* px-4 (not 6): the summary keeps one line next to the full label at 390 px. */}
        <Button variant="primary" size="md" onClick={onAdd} className="ml-auto px-4!">
          <AddToCartLabel price={price} />
        </Button>
      </div>
    </div>
  );
}
