"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

import { promoFadeIn } from "@/components/layout/promo/PromoMotion";
import {
  formatCampaignEnd,
  formatCampaignEndShort,
  formatCountdown,
  splitCampaignMessage,
  visibleCampaignParts,
} from "@/components/layout/promo/format";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/components/layout/promo/useMediaQuery";
import { site } from "@/content/site";
import { getCountdown } from "@/lib/campaign";
import { cn } from "@/lib/cn";
import type { Campaign } from "@/lib/types";

/**
 * Campaign line of the promo bar: the message from offers.campaign with its
 * code as an outlined pill, and a countdown to the fixed `endsAt`.
 *
 * The countdown is aria-hidden and not a live region (it would announce every
 * second); screen readers get the message as one sentence plus the fixed end
 * time. Rendered only after mount (PromoBar passes `now` from useNow), so it
 * never affects hydration.
 *
 * Pause, stop, hide (WCAG 2.2.2): the countdown ticks every second, so a
 * toggle after it ("Pause countdown", constant label, state in aria-pressed)
 * swaps it for the fixed end ("Ends 1 November, 23:59"). With
 * prefers-reduced-motion the fixed end is shown from the start and nothing
 * ticks, so there is no toggle.
 *
 * Mobile: two lines (message and code; conditions, countdown and toggle).
 * Both wrap rather than clip when the text cannot fit (WCAG 1.4.12).
 * Desktop (lg+): one line, parts separated by thin dividers.
 */

export interface CampaignMessageProps {
  campaign: Campaign;
  now: Date;
}

function CodePill({ code }: { code: string }) {
  // A border, not a box-shadow ring, so the outline stays visible in forced colors.
  return (
    <span className="inline-flex h-[18px] items-center rounded-full border border-fog/45 px-2 text-[10.5px] leading-none font-semibold tracking-[0.1em] lg:h-5 lg:text-[11px]">
      {code}
    </span>
  );
}

function Divider({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("h-3 w-px shrink-0 bg-fog/25", className)} />;
}

export function CampaignMessage({ campaign, now }: CampaignMessageProps) {
  // Server snapshot "reduce" never applies here: this only mounts after hydration.
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY, true);
  const [paused, setPaused] = useState(false);

  const { lead, code, codeSuffix, tail } = visibleCampaignParts(
    splitCampaignMessage(campaign.message, campaign.code),
  );
  const endText = formatCampaignEnd(campaign.endsAt);
  const endShort = formatCampaignEndShort(campaign.endsAt);
  const showFixedEnd = (reducedMotion || paused) && endShort !== null;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-y-0.5 py-1 text-center lg:flex-row lg:gap-x-3",
        promoFadeIn,
      )}
    >
      {/* Screen readers get the message as one sentence and the fixed end time; the visual parts are hidden from them. */}
      <p className="sr-only">
        {campaign.message}{" "}
        {endText ? <time dateTime={campaign.endsAt}>{endText}</time> : null}
      </p>

      <span
        aria-hidden="true"
        className="inline-flex flex-wrap items-center justify-center gap-x-1.5 lg:flex-nowrap lg:whitespace-nowrap"
      >
        <span>{lead}</span>
        {code ? <CodePill code={code} /> : null}
        {codeSuffix ? <span>{codeSuffix}</span> : null}
      </span>

      {tail ? <Divider className="hidden lg:block" /> : null}

      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-2.5 lg:flex-nowrap lg:gap-x-3 lg:whitespace-nowrap">
        {tail ? (
          <>
            <span aria-hidden="true">{tail}</span>
            <Divider />
          </>
        ) : null}
        <span aria-hidden="true">
          {showFixedEnd ? (
            <span className="tabular">{endShort}</span>
          ) : (
            <>
              <span className="text-mist">{site.promoBar.endsIn}</span>{" "}
              <span className="tabular font-semibold">{formatCountdown(getCountdown(now, campaign.endsAt))}</span>
            </>
          )}
        </span>
        {reducedMotion ? null : (
          <button
            type="button"
            aria-label={site.promoBar.pauseCountdown}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
            // -my-1 keeps the 24 px target from making the 16 px line taller.
            className="-my-1 -ml-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-mist transition-colors hover:bg-fog/10 hover:text-fog lg:ml-0"
          >
            {paused ? (
              <Play aria-hidden="true" className="size-3" strokeWidth={2} fill="currentColor" />
            ) : (
              <Pause aria-hidden="true" className="size-3" strokeWidth={2} fill="currentColor" />
            )}
          </button>
        )}
      </span>
    </div>
  );
}
