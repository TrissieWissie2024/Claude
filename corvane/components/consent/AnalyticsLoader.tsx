"use client";

import Script from "next/script";
import { useLayoutEffect, useSyncExternalStore } from "react";

import { site } from "@/content/site";
import {
  getConsent,
  getServerConsent,
  gtmScriptUrl,
  initConsentMode,
  isValidGtmId,
  shouldLoadAnalytics,
  startTagManager,
  subscribeConsent,
  syncConsentMode,
  type ConsentSnapshot,
} from "@/lib/analytics";

/**
 * Loads Google Tag Manager, and only when shouldLoadAnalytics() allows it:
 * site.analytics.enabled, a valid site.analytics.gtmId and the visitor's
 * "Accept analytics" (docs/PLAN.md §12). Renders nothing otherwise, so the
 * default build makes no third-party request at all.
 *
 * - Consent is read with useSyncExternalStore (undefined on the server and
 *   during hydration), so the server HTML never holds the script or a
 *   preload for it, and a choice in the banner (or in another tab) takes
 *   effect without a reload.
 * - Before anything can fire, the Consent Mode defaults (all denied) go onto
 *   window.dataLayer, then an update for analytics_storage whenever the
 *   choice changes, then the "gtm.js" start event. This runs in a layout
 *   effect, which React runs before the passive effect in which next/script
 *   inserts the script, so the tag manager finds them in order.
 * - Withdrawing consent after GTM loaded pushes analytics_storage "denied"
 *   and removes the Google Analytics cookies. A loaded script cannot be
 *   unloaded; next/script does not insert it twice when consent returns.
 * - No <noscript> iframe: it would load GTM without asking.
 */
export function AnalyticsLoader() {
  const { enabled, gtmId } = site.analytics;
  const configured = enabled && isValidGtmId(gtmId);
  const consent = useSyncExternalStore<ConsentSnapshot>(subscribeConsent, getConsent, getServerConsent);
  const load = shouldLoadAnalytics({ enabled, gtmId, consent });

  useLayoutEffect(() => {
    if (!configured) return;
    initConsentMode();
    if (consent === undefined) return;
    syncConsentMode(consent);
    if (load) startTagManager();
  }, [configured, consent, load]);

  if (!load) return null;
  return <Script id="corvane-gtm" src={gtmScriptUrl(gtmId)} strategy="afterInteractive" />;
}
