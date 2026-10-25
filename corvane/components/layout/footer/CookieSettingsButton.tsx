"use client";

import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Window event that reopens the cookie consent banner. The banner
 * (components/consent/ConsentBanner, phase 8) listens for it:
 *   window.addEventListener(OPEN_CONSENT_EVENT, open)
 * Import it from client code only (this is a client module); server code can
 * use the literal "corvane:open-consent".
 */
export const OPEN_CONSENT_EVENT = "corvane:open-consent";

/**
 * "Cookie settings" in the footer. The Footer renders it only when
 * site.analytics.enabled is true (docs/PLAN.md §12); without analytics there
 * is no banner to reopen. Styled as a text link, it is a real <button>.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={cn("cursor-pointer underline underline-offset-4 hover:text-fog", className)}
    >
      {site.consentBanner.settings}
    </button>
  );
}
