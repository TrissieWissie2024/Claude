import { shipping } from "@/content/shipping";
import { site } from "@/content/site";
import type { Countdown } from "@/lib/campaign";
import { getZonedParts } from "@/lib/delivery";

/**
 * Pure formatting helpers for the promo bar. No clock reads here: the bar
 * passes `now` from useNow() and these only shape text.
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * "6d 4h" while more than a day is left (it changes once an hour, so the bar
 * stays calm); "04:12:09" with seconds only in the final 24 hours.
 */
export function formatCountdown({ days, hours, minutes, seconds }: Countdown): string {
  const { units } = site.promoBar;
  if (days > 0) return `${days}${units.days} ${hours}${units.hours}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** Date ("1 November") and time ("23:59") of the fixed campaign end in warehouse time; null when unparseable. */
function campaignEndParts(endsAt: string): { date: string; time: string } | null {
  const ms = Date.parse(endsAt);
  if (Number.isNaN(ms)) return null;
  const parts = getZonedParts(new Date(ms), shipping.timeZone);
  const month = monthName.format(new Date(Date.UTC(parts.year, parts.month - 1, 1)));
  return { date: `${parts.day} ${month}`, time: `${pad(parts.hour)}:${pad(parts.minute)}` };
}

/**
 * The fixed campaign end in warehouse time, for screen readers:
 * "Offer ends 1 November at 23:59 Amsterdam time." Null when `endsAt` cannot be parsed.
 */
export function formatCampaignEnd(endsAt: string): string | null {
  const parts = campaignEndParts(endsAt);
  return parts ? site.promoBar.endsAtFull(parts.date, parts.time) : null;
}

/**
 * The fixed campaign end as a short visible line, shown instead of the
 * countdown while it is paused or with reduced motion: "Ends 1 November, 23:59".
 */
export function formatCampaignEndShort(endsAt: string): string | null {
  const parts = campaignEndParts(endsAt);
  return parts ? site.promoBar.endsAtShort(parts.date, parts.time) : null;
}

export interface CampaignMessageParts {
  /** Text before the code, trimmed: "Launch week: 15% off with code". */
  lead: string;
  /** The code as written in the message, or null when the message does not contain it. */
  code: string | null;
  /** Punctuation glued to the code: ".". */
  codeSuffix: string;
  /** The rest, e.g. the conditions: "Excludes gift cards.". */
  tail: string;
}

/**
 * Splits the campaign message around its code so the code can be drawn as a
 * pill: "Launch week: 15% off with code LAUNCH15. Excludes gift cards." becomes
 * lead "Launch week: 15% off with code", code "LAUNCH15", codeSuffix ".",
 * tail "Excludes gift cards.". Without a code (or when the message does not
 * name it) the whole message is the lead.
 */
export function splitCampaignMessage(message: string, code?: string): CampaignMessageParts {
  const at = code ? message.indexOf(code) : -1;
  if (!code || at === -1) return { lead: message.trim(), code: null, codeSuffix: "", tail: "" };
  const after = message.slice(at + code.length);
  const match = /^(\S*)([\s\S]*)$/.exec(after);
  return {
    lead: message.slice(0, at).trim(),
    code,
    codeSuffix: match?.[1] ?? "",
    tail: (match?.[2] ?? "").trim(),
  };
}

/**
 * Visible form of the split message for the bar, where the code is a pill and
 * the parts are separated by thin dividers: punctuation-only suffixes are
 * dropped (no stray "." after the pill) and a trailing full stop comes off the
 * tail. The screen reader sentence always keeps the full message.
 */
export function visibleCampaignParts(parts: CampaignMessageParts): CampaignMessageParts {
  return {
    ...parts,
    codeSuffix: /[\p{L}\p{N}]/u.test(parts.codeSuffix) ? parts.codeSuffix : "",
    tail: parts.tail.replace(/\.$/, ""),
  };
}
