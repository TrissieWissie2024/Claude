import { promoFadeIn } from "@/components/layout/promo/PromoMotion";
import { formatCampaignEnd, formatCountdown, splitCampaignMessage } from "@/components/layout/promo/format";
import { site } from "@/content/site";
import { getCountdown } from "@/lib/campaign";
import { cn } from "@/lib/cn";
import type { Campaign } from "@/lib/types";

/**
 * Campaign line of the promo bar: the message from offers.campaign with its
 * code as an outlined pill, and a countdown to the fixed `endsAt`.
 *
 * The countdown is aria-hidden and not a live region (it would announce every
 * second); screen readers get the fixed end time instead. Rendered only after
 * mount (PromoBar passes `now` from useNow), so it never affects hydration.
 *
 * Mobile: two lines (message and code; conditions and countdown).
 * Desktop (lg+): one line, countdown after a thin divider.
 */

export interface CampaignMessageProps {
  campaign: Campaign;
  now: Date;
}

function CodePill({ code }: { code: string }) {
  return (
    <span className="ml-1.5 inline-flex h-[18px] items-center rounded-full px-2 text-[10.5px] leading-none font-semibold tracking-[0.1em] ring-1 ring-fog/45 ring-inset lg:h-5 lg:text-[11px]">
      {code}
    </span>
  );
}

function Divider() {
  return <span aria-hidden="true" className="h-3 w-px shrink-0 bg-fog/25" />;
}

export function CampaignMessage({ campaign, now }: CampaignMessageProps) {
  const { lead, code, codeSuffix, tail } = splitCampaignMessage(campaign.message, campaign.code);
  const countdown = formatCountdown(getCountdown(now, campaign.endsAt));
  const endText = formatCampaignEnd(campaign.endsAt);

  return (
    <p
      className={cn(
        "flex h-full flex-col items-center justify-center gap-y-0.5 text-center lg:flex-row lg:gap-x-[0.3em]",
        promoFadeIn,
      )}
    >
      {/* Screen readers get the message as one sentence and the fixed end time; the visual parts are hidden from them. */}
      <span className="sr-only">
        {campaign.message}{" "}
        {endText ? <time dateTime={campaign.endsAt}>{endText}</time> : null}
      </span>
      <span aria-hidden="true" className="inline-flex items-center whitespace-nowrap">
        {lead}
        {code ? <CodePill code={code} /> : null}
        {codeSuffix}
      </span>
      <span aria-hidden="true" className="inline-flex items-center gap-2.5 whitespace-nowrap lg:gap-3">
        {tail ? (
          <>
            <span>{tail}</span>
            <Divider />
          </>
        ) : null}
        <span>
          <span className="text-mist">{site.promoBar.endsIn}</span>{" "}
          <span className="tabular font-semibold">{countdown}</span>
        </span>
      </span>
    </p>
  );
}
