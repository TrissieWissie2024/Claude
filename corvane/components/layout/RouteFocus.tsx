"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Keeps keyboard focus on the page after a client-side navigation (WCAG 2.4.3).
 *
 * With Cache Components, React Activity keeps the previous route mounted but
 * hidden (display: none). A link in that route that started the navigation
 * loses its focus to <body>, while the browser's sequential focus starting
 * point stays at the hidden link: the next Tab skips the whole new page and
 * lands in the footer. After every pathname change (not on the first render)
 * this moves the focus to <main id="main" tabIndex={-1}> when the focused
 * element is <body> or no longer rendered, so the next Tab starts at the top
 * of the new page. Focus that is still visible (a header link, a control that
 * placed it on purpose, such as the scent swatches) is left alone.
 *
 * Renders nothing. Mounted once in app/layout.tsx.
 */
export function RouteFocus({ targetId = "main" }: { targetId?: string }) {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === null || previous.current === pathname) {
      previous.current = pathname;
      return;
    }
    previous.current = pathname;

    const active = document.activeElement;
    const lost =
      active === null ||
      active === document.body ||
      (active instanceof HTMLElement && typeof active.checkVisibility === "function" && !active.checkVisibility());
    if (!lost) return;
    document.getElementById(targetId)?.focus({ preventScroll: true });
  }, [pathname, targetId]);

  return null;
}
