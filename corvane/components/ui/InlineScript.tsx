"use client";

/**
 * A small inline script that runs while the browser parses the HTML, before
 * the first paint (Next.js guide "preventing flash before hydration"). Use it
 * only to set an attribute that CSS reads; never to render content.
 *
 * Server-rendered it is `text/javascript` and runs on a full page load. On a
 * client-side navigation React renders it as `text/plain`, so it neither runs
 * (scripts inserted by React never do) nor triggers React's script warning;
 * suppressHydrationWarning covers the type difference. A Client Component, so
 * `typeof window` is evaluated in the browser.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
