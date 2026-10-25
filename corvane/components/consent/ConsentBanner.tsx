"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";

import { OPEN_CONSENT_EVENT } from "@/components/layout/footer/CookieSettingsButton";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import {
  getConsent,
  getServerConsent,
  setConsent,
  shouldShowConsentBanner,
  subscribeConsent,
  type ConsentSnapshot,
  type ConsentValue,
} from "@/lib/analytics";

const copy = site.consentBanner;

/**
 * Window event of components/pdp/StickyAddToCart (STICKY_ATC_EVENT), sent after
 * it changes the body padding and scroll padding. The literal keeps the
 * product page code out of the layout bundle.
 */
const STICKY_ATC_EVENT = "corvane:sticky-atc";

/** Space kept clear above the banner when the browser scrolls a focused element into view. */
const FOCUS_CLEARANCE_PX = 16;

function restoreStyle(style: CSSStyleDeclaration, property: string, value: string): void {
  if (value) style.setProperty(property, value);
  else style.removeProperty(property);
}

/**
 * Cookie consent banner (brief §7, docs/PLAN.md §10 and §12).
 *
 * - Exists only when site.analytics.enabled is true; otherwise it renders
 *   nothing at all. Shows after hydration when there is no stored choice
 *   (shouldShowConsentBanner), and again when the footer's "Cookie
 *   settings" sends the window event "corvane:open-consent".
 * - A fixed fog card at the bottom, like the email pill it replaces while
 *   open (full width minus the gutter on phones, bottom left from `sm`),
 *   z-50 (PLAN §10), never covering the whole screen. Accept and Reject are the same style and size. Short text with a
 *   link to the Cookie Policy.
 * - Not a modal: no focus trap, no backdrop, the page stays usable. It sits
 *   early in the DOM (after the skip link), so keyboard and screen reader
 *   users reach it first. Opened from the footer, it takes the focus on its
 *   heading; after a choice the focus goes back to the button that opened it
 *   (or to <main>), and a status line announces the result. Escape closes it
 *   when it was reopened and a choice already exists.
 * - While open it sets data-consent-open="true" on <body> (the email pill
 *   hides and the popup does not open by itself). Like the mobile sticky
 *   add-to-cart, it gives <body> a bottom padding of the space it covers
 *   (the end of the footer can be scrolled clear of it) and <html> a
 *   scroll-padding-bottom, so a focused element is never scrolled in under
 *   it (WCAG 2.4.11). The sticky bar's own values come back on close.
 * - The choice is stored through lib/analytics setConsent();
 *   components/consent/AnalyticsLoader reacts to it without a reload.
 */
export function ConsentBanner() {
  const enabled = site.analytics.enabled;
  const consent = useSyncExternalStore<ConsentSnapshot>(subscribeConsent, getConsent, getServerConsent);
  const [reopened, setReopened] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const visible = shouldShowConsentBanner({ enabled, consent, reopened });

  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** The control that opened the banner again, to return focus to it. */
  const openerRef = useRef<HTMLElement | null>(null);
  /** Set by "Cookie settings" while the banner is closed: focus the heading once it shows. */
  const focusOnShowRef = useRef(false);

  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;

  // "Cookie settings" in the footer.
  useEffect(() => {
    if (!enabled) return;
    const open = () => {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
      setAnnouncement("");
      setReopened(true);
      if (headingRef.current) headingRef.current.focus();
      else focusOnShowRef.current = true;
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, [enabled]);

  // While open: body flag for the email pill, room at the bottom, focus when opened from the footer.
  useEffect(() => {
    const panel = panelRef.current;
    if (!visible || !panel) return;
    const body = document.body;
    const root = document.documentElement;
    body.dataset.consentOpen = "true";

    // The mobile sticky add-to-cart writes the same two properties. While the banner is open its
    // (larger) values win; the bar's latest values are kept and handed back on close.
    let theirs = { padding: body.style.paddingBottom, scrollPadding: root.style.scrollPaddingBottom };
    let covered = 0;
    const apply = () => {
      // Body padding: the end of the footer can always be scrolled clear of the banner.
      body.style.paddingBottom = `${covered}px`;
      // Scroll padding: a focused element is scrolled in above the banner (WCAG 2.4.11).
      root.style.scrollPaddingBottom = `${covered + FOCUS_CLEARANCE_PX}px`;
    };
    const measure = () => {
      // Height plus the bottom offset; layout values, so the entrance transition does not skew them.
      covered = Math.ceil(panel.offsetHeight + (Number.parseFloat(getComputedStyle(panel).bottom) || 0));
      apply();
    };
    const onStickyBar = () => {
      theirs = { padding: body.style.paddingBottom, scrollPadding: root.style.scrollPaddingBottom };
      apply();
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(panel);
    window.addEventListener("resize", measure);
    window.addEventListener(STICKY_ATC_EVENT, onStickyBar);

    if (focusOnShowRef.current) {
      focusOnShowRef.current = false;
      headingRef.current?.focus();
    }

    return () => {
      delete body.dataset.consentOpen;
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener(STICKY_ATC_EVENT, onStickyBar);
      restoreStyle(body.style, "padding-bottom", theirs.padding);
      restoreStyle(root.style, "scroll-padding-bottom", theirs.scrollPadding);
    };
  }, [visible]);

  if (!enabled) return null;

  /** Closes the banner; focus goes back to the opener, or to <main>, if it was inside. */
  function close(choice: ConsentValue | null) {
    const panel = panelRef.current;
    const focusWasInside = panel !== null && panel.contains(document.activeElement);
    const opener = openerRef.current;
    openerRef.current = null;
    focusOnShowRef.current = false;

    if (choice) {
      setConsent(choice);
      setAnnouncement(copy.saved[choice]);
    }
    setReopened(false);

    if (focusWasInside) {
      const target = opener?.isConnected ? opener : document.getElementById("main");
      target?.focus({ preventScroll: true });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    // Only a reopened banner can be dismissed: a first visit needs an answer.
    if (event.key !== "Escape" || !reopened || !consent) return;
    event.preventDefault();
    close(null);
  }

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {visible ? (
        <section
          ref={panelRef}
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          onKeyDown={onKeyDown}
          className={cn(
            "fixed z-50 print:hidden",
            "right-[calc(1rem+env(safe-area-inset-right,0px))] bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))]",
            "sm:right-auto sm:w-[30rem] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:left-[calc(1.5rem+env(safe-area-inset-left,0px))]",
            "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
            "rounded-card border border-line bg-fog p-5 text-ink shadow-lift sm:p-6",
            "motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:ease-out",
            "motion-safe:starting:translate-y-3 motion-safe:starting:opacity-0",
          )}
        >
          <h2
            ref={headingRef}
            id={titleId}
            tabIndex={-1}
            className="font-serif text-[1.375rem] leading-tight text-ink"
          >
            {copy.title}
          </h2>
          <p id={bodyId} className="mt-2 text-[0.875rem] leading-[1.6] text-ink-soft">
            {copy.body} {copy.linkBefore}{" "}
            <Link href={copy.href} className="text-ink underline underline-offset-4 hover:no-underline">
              {copy.linkLabel}
            </Link>
            .
          </p>
          {reopened && consent ? (
            <p className="mt-2 text-[0.875rem] leading-[1.6] font-medium text-ink">{copy.current[consent]}</p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" fullWidth onClick={() => close("denied")}>
              {copy.reject}
            </Button>
            <Button variant="outline" fullWidth onClick={() => close("granted")}>
              {copy.accept}
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
