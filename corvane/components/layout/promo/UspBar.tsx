"use client";

import { Package, Pause, Play, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { useEffect, useState, type FocusEvent } from "react";

import { promoFadeIn } from "@/components/layout/promo/PromoMotion";
import { DESKTOP_QUERY, useMediaQuery } from "@/components/layout/promo/useMediaQuery";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * USP bar of the promo bar (docs/PLAN.md §8): three lines from site.usps that
 * are true on every day of the year.
 *
 * - Mobile (< lg): one line at a time, rotating every 4 s. Rotation pauses on
 *   hover and while focus is inside, and the pause button stops it for good
 *   (WCAG 2.2.2). The fade is motion-safe only: with prefers-reduced-motion the
 *   lines still rotate (so all three stay visible) but swap without animation.
 *   Screen readers get all three lines as a list; the rotating line itself is
 *   aria-hidden. The button sits at the right edge below md (its centre lines
 *   up with the header icons) and right after the text from md to lg.
 * - Desktop (lg+): all three inline with thin dividers, no rotation.
 *
 * On the server and during hydration it renders the still first line (and the
 * full desktop row), so the static HTML is always correct; rotation starts in
 * an effect after hydration.
 */

const ROTATE_MS = 4000;

const icons: Record<string, LucideIcon> = {
  truck: Truck,
  "shield-check": ShieldCheck,
  package: Package,
};

function UspIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name];
  return Icon ? (
    <Icon aria-hidden="true" className={cn("size-3.5 shrink-0 text-mist", className)} strokeWidth={1.75} />
  ) : null;
}

export function UspBar() {
  const items = site.usps;
  const desktop = useMediaQuery(DESKTOP_QUERY, false);
  const canRotate = !desktop && items.length > 1;

  /** Number of rotations so far; the visible line is step % items.length. */
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const running = canRotate && !paused && !hovered && !focused;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setStep((current) => current + 1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const current = items[canRotate ? step % items.length : 0];

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <>
      {/* Mobile: one line, rotating. */}
      <div
        className="relative flex w-full items-center justify-center px-8 md:gap-3 md:px-0 lg:hidden"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
      >
        <ul className="sr-only">
          {items.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
        {/* One line from 390 px; narrower phones wrap to two balanced lines (still 48 px tall), icon inline with the first. */}
        <p
          key={step}
          aria-hidden="true"
          className={cn("min-w-0 text-center text-balance", step > 0 && promoFadeIn)}
        >
          <UspIcon name={current.icon} className="mr-2 inline-block" />
          {site.promoBar.uspShort[current.id] ?? current.text}
        </p>
        {canRotate ? (
          <button
            type="button"
            aria-label={site.promoBar.pause}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
            className="absolute top-1/2 right-1 flex size-6 shrink-0 -translate-y-1/2 items-center justify-center rounded-full text-mist transition-colors hover:bg-fog/10 hover:text-fog md:static md:translate-y-0"
          >
            {paused ? (
              <Play aria-hidden="true" className="size-3" strokeWidth={2} fill="currentColor" />
            ) : (
              <Pause aria-hidden="true" className="size-3" strokeWidth={2} fill="currentColor" />
            )}
          </button>
        ) : null}
      </div>

      {/* Desktop: all three, inline. */}
      <ul className="hidden w-full items-center justify-center lg:flex">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center whitespace-nowrap">
            {index > 0 ? <span aria-hidden="true" className="mx-6 h-3 w-px bg-fog/25 xl:mx-8" /> : null}
            <span className="flex items-center gap-2">
              <UspIcon name={item.icon} />
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
