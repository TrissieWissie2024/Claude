"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

/**
 * A list that scrolls sideways at some widths only, e.g. a scroll-snap row on
 * phones that becomes a plain grid from md (the "From CORVANE" films).
 *
 * It takes keyboard focus (tabIndex 0) only while it really overflows, so
 * keyboard users can scroll it with the arrow keys where it scrolls, and it is
 * not an empty Tab stop where it does not. A ResizeObserver re-checks on every
 * size change; it reports once right away, after hydration. Before that the
 * list is focusable, which is right for the phone layout and harmless on
 * desktop. Give it an aria-label: that is what a screen reader announces when
 * it takes focus.
 */

export type ScrollRowProps = ComponentPropsWithoutRef<"ul">;

export function ScrollRow({ children, ...rest }: ScrollRowProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [overflows, setOverflows] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      // 1 px of slack for sub-pixel rounding.
      setOverflows(element.scrollWidth > element.clientWidth + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} tabIndex={overflows ? 0 : undefined} {...rest}>
      {children}
    </ul>
  );
}
