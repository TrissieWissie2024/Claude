import { InlineScript } from "@/components/ui/InlineScript";

/**
 * Shows prerendered Suspense content as soon as it is parsed (phase 8).
 *
 * React (19.2+) moves a finished Suspense boundary larger than about 12.8 KB
 * of HTML out of line: the fallback goes into the shell and the content
 * follows later in the same document, revealed by React's inline `$RC`
 * script. To batch reveals while streaming, that script waits until 300 ms
 * after the shell's first animation frame, timed from the global `$RT`. Our
 * pages are prerendered, so the content is already in the document and the
 * wait only delays it: on /products/[slug] the skeleton showed for about
 * 300 ms before the product (name, gallery, price) appeared, which was also
 * the page's Largest Contentful Paint.
 *
 * This script runs in <head> (app/layout.tsx), before any boundary is
 * revealed, and makes `$RT` ignore writes and always read as undefined.
 * React then reveals each boundary in the next animation frame (its path for
 * "no shell time yet").
 * Nothing else reads `$RT`. If a future React drops the throttle or renames
 * the global, the script does nothing and the default behaviour returns.
 *
 * Since the phase 8 review (D54.1) the product page renders outside
 * <Suspense>, so today no prerendered page has an out-of-line boundary and
 * the throttle has nothing to delay. The script stays for any large
 * boundary that comes back, and for its place in <head>, below.
 *
 * Its place matters for a second reason: an inline script after a stylesheet
 * waits for that stylesheet, so the parser only builds the body once the CSS
 * is in and then parses, lays out and paints it in one task. The async
 * chunks run after that first paint. With the script in <body> (at the top
 * or at the end of the shell), Chrome often painted an earlier frame first
 * (an empty body, or the shell with the product skeleton) and ran React's
 * chunk before the frame with the product, and Lighthouse then counted that
 * chunk towards the Largest Contentful Paint: about 2.4 s or 3.2 s at random
 * on /products/north-swell (in 3 to 8 of 10 runs the slow one). In <head> it
 * was 2.3 to 2.65 s in every run.
 */
const SCRIPT =
  'try{Object.defineProperty(window,"$RT",{configurable:true,get:function(){},set:function(){}})}catch(e){}';

export function InstantReveal() {
  return <InlineScript html={SCRIPT} />;
}
