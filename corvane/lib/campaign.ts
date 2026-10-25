import { offers } from "@/content/offers";
import type { Campaign } from "@/lib/types";

/**
 * Campaign state (docs/PLAN.md §8, brief §2.3). Pure: `now` is always passed in.
 * The countdown only ever targets the fixed `endsAt` from content/offers.ts and
 * never resets per visitor or per day; after `endsAt` the campaign is gone.
 */

export interface Countdown {
  /** Milliseconds left, never negative. */
  totalMs: number;
  days: number;
  /** 0 to 23. */
  hours: number;
  /** 0 to 59. */
  minutes: number;
  /** 0 to 59. */
  seconds: number;
}

function toMs(value: string | Date | undefined): number | null {
  if (value === undefined) return null;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * The campaign when it is running at `now`: `active` is true and
 * startsAt <= now < endsAt (endsAt exclusive). Otherwise null, also when a
 * timestamp cannot be parsed.
 */
export function getActiveCampaign(now: Date, campaign: Campaign = offers.campaign): Campaign | null {
  if (!campaign.active) return null;
  const at = now.getTime();
  const endsAt = toMs(campaign.endsAt);
  if (endsAt === null || at >= endsAt) return null;
  if (campaign.startsAt !== undefined) {
    const startsAt = toMs(campaign.startsAt);
    if (startsAt === null || at < startsAt) return null;
  }
  return campaign;
}

/** Time left until `endsAt`, split into days, hours, minutes and seconds. Clamped at 0. */
export function getCountdown(now: Date, endsAt: string | Date): Countdown {
  const end = toMs(endsAt);
  const totalMs = end === null ? 0 : Math.max(0, end - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}
