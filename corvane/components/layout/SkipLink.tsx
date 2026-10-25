import { site } from "@/content/site";

/**
 * First focusable element on every page: jumps to <main id="main">.
 * Off screen until it gets focus, then a pill in the top-left corner above
 * the promo bar and the header.
 */
export function SkipLink({ targetId = "main" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-2 left-3 z-[70] inline-flex h-11 -translate-y-[calc(100%+1rem)] items-center rounded-full bg-fog px-5 text-sm font-semibold text-ink focus:translate-y-0 focus:shadow-lift focus-visible:outline-signal motion-safe:transition-transform motion-safe:duration-200 print:hidden"
    >
      {site.skipLink}
    </a>
  );
}
