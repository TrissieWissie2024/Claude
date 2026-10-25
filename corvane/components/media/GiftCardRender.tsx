import { VANE_CENTER, VANE_PATH } from "@/components/brand/VaneIcon";
import { WORDMARK_HEIGHT, WORDMARK_PATH, WORDMARK_WIDTH } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";

import { useSvgId } from "./StickRender";

/**
 * E-gift card render: a deep card with the vane icon and the wordmark, and
 * optionally the amount. Card ratio 1.6 : 1, slightly turned, with a soft
 * shadow; viewBox 380 x 260.
 */

export interface GiftCardRenderProps {
  /** Formatted amount, e.g. "€50" (use formatMoneyShort). Omit for the generic card. */
  amount?: string;
  /** Sizing; replaces the default "h-auto w-full". */
  className?: string;
  /** Hide from assistive technology when a caption already describes it. */
  decorative?: boolean;
}

export function GiftCardRender({ amount, className, decorative = false }: GiftCardRenderProps) {
  const id = useSvgId("gift");
  const wmWidth = 132;
  const wmScale = wmWidth / WORDMARK_WIDTH;
  const label = amount ? `CORVANE e-gift card, ${amount}` : "CORVANE e-gift card";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 380 260"
      className={cn("block", className ?? "h-auto w-full")}
      {...(decorative ? { "aria-hidden": true, focusable: false } : { role: "img", "aria-label": label })}
    >
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B4256" />
          <stop offset="0.55" stopColor="#0F2733" />
          <stop offset="1" stopColor="#0A1C25" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.07" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <rect x="-160" y="-100" width="320" height="200" rx="14" />
        </clipPath>
      </defs>

      <g transform="translate(190 126) rotate(-5)">
        <rect x="-150" y="-88" width="300" height="190" rx="14" fill="#000" opacity="0.32" filter={`url(#${id}-shadow)`} transform="translate(4 12)" />
        <rect x="-160" y="-100" width="320" height="200" rx="14" fill={`url(#${id}-card)`} />
        <g clipPath={`url(#${id}-clip)`}>
          {/* Large, faint vane as a watermark */}
          <path d={VANE_PATH} fill="#F7F5F1" opacity="0.04" transform="translate(-40 -112) scale(7.5)" />
          <rect x="-160" y="-100" width="320" height="200" fill={`url(#${id}-sheen)`} />
        </g>
        <rect x="-151" y="-91" width="302" height="182" rx="9" fill="none" stroke="#F7F5F1" strokeOpacity="0.14" strokeWidth="0.8" />
        <rect x="-160" y="-100" width="320" height="200" rx="14" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />

        <path
          d={VANE_PATH}
          fill="#F7F5F1"
          transform={`translate(${-136 - 2.5 * 1.1} ${-62 - VANE_CENTER.y * 1.1}) scale(1.1)`}
        />
        {amount ? (
          <text x="136" y="-48" textAnchor="end" className="font-serif" fontSize="34" fontWeight="600" fill="#F7F5F1">
            {amount}
          </text>
        ) : null}
        <path d={WORDMARK_PATH} fill="#F7F5F1" transform={`translate(-136 ${62}) scale(${wmScale})`} />
        <text
          x="136"
          y={62 + WORDMARK_HEIGHT * wmScale}
          textAnchor="end"
          className="font-sans"
          fontSize="8"
          fontWeight="600"
          letterSpacing="2.2"
          fill="#B9C4C9"
        >
          E-GIFT CARD
        </text>
      </g>
    </svg>
  );
}
