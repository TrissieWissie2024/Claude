"use client";

import { useEffect, useState } from "react";

/**
 * Current time, but only after mount. Returns null during server rendering
 * and the first client render, so time-dependent UI never causes a
 * hydration mismatch. Re-renders every `intervalMs` (default 1 s).
 */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set on the next frame so the first paint matches the server HTML.
    const raf = requestAnimationFrame(() => setNow(new Date()));
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return now;
}
