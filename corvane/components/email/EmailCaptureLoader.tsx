"use client";

import dynamic from "next/dynamic";

import { site } from "@/content/site";
import { useAfterLoad } from "@/lib/hooks/useAfterLoad";

/** The pill, the modal (Radix Dialog), the cards, the form and the code in a chunk of their own. */
const EmailCapture = dynamic(() => import("@/components/email/EmailCapture").then((module) => module.EmailCapture), {
  ssr: false,
});

/**
 * Mounts the email capture (components/email/EmailCapture) once the page has
 * settled (useAfterLoad: loaded and idle, or the first interaction). It
 * renders nothing on the server and before that anyway: the pill only appears
 * after 240 px of scrolling (a scroll also settles the page), and the popup
 * opens on its own 8 s after the page started loading, counted with
 * performance.now(). So nothing changes for visitors; its JavaScript just
 * stays out of the initial load (phase 8). Render it once, in app/layout.tsx,
 * inside CartProvider.
 */
export function EmailCaptureLoader() {
  const settled = useAfterLoad();
  return settled && site.emailCapture.enabled ? <EmailCapture /> : null;
}
