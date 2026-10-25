"use client";

import { CampaignMessage } from "@/components/layout/promo/CampaignMessage";
import { PromoMotion } from "@/components/layout/promo/PromoMotion";
import { UspBar } from "@/components/layout/promo/UspBar";
import { site } from "@/content/site";
import { getActiveCampaign } from "@/lib/campaign";
import { useNow } from "@/lib/hooks/useNow";

/**
 * Promo bar above the sticky header (brief §6.1, docs/PLAN.md §8). In normal
 * flow, so it scrolls away while the header sticks. Always exactly
 * var(--promo-height) tall, whatever it shows, so nothing shifts.
 *
 * - Before mount (server, prerender, hydration) `now` is null: the USP bar,
 *   whose text is true on every day.
 * - After mount, while offers.campaign runs (getActiveCampaign): the campaign
 *   message with its code and a countdown to the fixed `endsAt`.
 * - From `endsAt` on, the next tick switches back to the USP bar by itself.
 *
 * This is the only countdown on the site; there is never one to the 15:00
 * dispatch cut-off (brief §2.3).
 */
export function PromoBar() {
  const now = useNow(1000);
  const campaign = now ? getActiveCampaign(now) : null;

  return (
    <section
      aria-label={site.promoBar.regionLabel}
      className="focus-on-dark relative h-promo overflow-hidden bg-deep text-xs leading-4 font-medium tracking-[0.01em] text-fog lg:text-[13px]"
    >
      <PromoMotion />
      {/* Container width, with a 16 px gutter on phones so the longest USP line fits on one line. */}
      <div className="mx-auto h-full w-full max-w-[1240px] px-4 md:px-8">
        {campaign && now ? <CampaignMessage campaign={campaign} now={now} /> : <UspBar />}
      </div>
    </section>
  );
}
