"use client";

import { VANE_CENTER, VANE_PATH } from "@/components/brand/VaneIcon";
import { Wordmark } from "@/components/brand/Wordmark";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * The three face-down cards of the email capture (brief §2.8, docs/PLAN.md §10.3-4).
 *
 * - Every card is a <button> ("Card 1 of 3"). Every card hides the same
 *   reward, and the dialog says so before a card is turned.
 * - Turning one flips it with a CSS 3D flip, behind `motion-safe:` only. With
 *   prefers-reduced-motion there is no transform at all: the back is swapped
 *   for the front at once.
 * - The other two cards then turn as well (a little later, with motion), so
 *   the visitor can see that they hold the same reward. Their captions say
 *   "Your card" and "Same reward".
 * - After the turn the cards stay in place and stay readable: the chosen card
 *   keeps focus (aria-disabled, so a second press does nothing) and the
 *   other two leave the tab order, so the next Tab reaches the email field.
 */

export const CARD_COUNT = 3;

/** Flip delays of the two other cards, after the chosen one (motion only). */
const FOLLOW_DELAYS = ["motion-safe:delay-[420ms]", "motion-safe:delay-[560ms]"];

/** Card back: the vane inside a compass ring on deep, with the wordmark. */
function CardBack({ className }: { className?: string }) {
  const ticks = [
    { x1: 50, y1: 7, x2: 50, y2: 15 },
    { x1: 93, y1: 50, x2: 85, y2: 50 },
    { x1: 50, y1: 93, x2: 50, y2: 85 },
    { x1: 7, y1: 50, x2: 15, y2: 50 },
  ];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[12px] bg-deep text-fog",
        "shadow-soft transition-shadow duration-300 group-hover:shadow-lift motion-safe:backface-hidden",
        className,
      )}
    >
      {/* Inner frame */}
      <span className="absolute inset-[5px] rounded-[8px] border border-line-on-deep sm:inset-[7px] sm:rounded-[9px]" />
      <svg viewBox="0 0 100 100" fill="none" className="-mt-[8%] w-[64%]">
        <circle cx="50" cy="50" r="39" stroke="currentColor" strokeOpacity="0.24" strokeWidth="1.25" />
        {ticks.map((tick) => (
          <line key={`${tick.x1}-${tick.y1}`} {...tick} stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        ))}
        <g transform={`translate(50 50) scale(1.5) translate(${-VANE_CENTER.x} ${-VANE_CENTER.y})`}>
          <path d={VANE_PATH} fill="currentColor" />
        </g>
      </svg>
      <Wordmark decorative className="absolute bottom-[11%] h-[5px] w-auto text-mist sm:h-[7px]" />
    </span>
  );
}

/** Card front: the same reward on every card. */
function CardFace({ chosen, className }: { chosen: boolean; className?: string }) {
  const face = site.emailCapture.cardFace;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center rounded-[12px] bg-fog px-2 text-center text-ink shadow-soft",
        "motion-safe:rotate-y-180 motion-safe:backface-hidden",
        chosen ? "ring-2 ring-ink ring-inset" : "ring-1 ring-line ring-inset",
        className,
      )}
    >
      <span className="font-serif text-[1.75rem] leading-none tracking-[-0.02em] sm:text-[2.5rem]">{face.value}</span>
      <span className="my-2 h-px w-4 bg-signal sm:my-2.5 sm:w-5" />
      <span className="max-w-[9ch] text-[0.6875rem] leading-[1.3] text-ink-soft sm:max-w-[10ch] sm:text-[0.8125rem]">
        {face.line}
      </span>
    </span>
  );
}

export interface RewardCardsProps {
  /** Index (0-based) of the card the visitor turned, or null while all are face down. */
  chosen: number | null;
  onChoose: (index: number) => void;
}

export function RewardCards({ chosen, onChoose }: RewardCardsProps) {
  const copy = site.emailCapture;
  const revealed = chosen !== null;
  const others = Array.from({ length: CARD_COUNT }, (_, index) => index).filter((index) => index !== chosen);

  return (
    <div role="group" aria-label={copy.cardsLabel} className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {Array.from({ length: CARD_COUNT }, (_, index) => {
        const isChosen = chosen === index;
        const number = index + 1;
        const label = !revealed
          ? copy.card(number, CARD_COUNT)
          : isChosen
            ? copy.cardChosen(number, CARD_COUNT, copy.rewardLabel)
            : copy.cardRevealed(number, CARD_COUNT, copy.rewardLabel);
        const followDelay = revealed && !isChosen ? FOLLOW_DELAYS[others.indexOf(index)] : undefined;

        return (
          <div key={index} className="flex min-w-0 flex-col items-center gap-2">
            <button
              type="button"
              aria-label={label}
              aria-disabled={revealed || undefined}
              tabIndex={revealed && !isChosen ? -1 : undefined}
              onClick={() => {
                if (!revealed) onChoose(index);
              }}
              data-card={number}
              data-revealed={revealed || undefined}
              className={cn(
                "group relative block aspect-[3/4] w-full rounded-[12px] perspective-[1000px]",
                revealed ? "cursor-default" : "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "relative block size-full rounded-[12px]",
                  "motion-safe:transition-[transform,translate] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.3,0.7,0.2,1)] motion-safe:transform-3d",
                  revealed ? "motion-safe:rotate-y-180" : "motion-safe:group-hover:-translate-y-1",
                  followDelay,
                )}
              >
                {/* Reduced motion: no transform; the back is swapped for the front at once. */}
                <CardBack className={cn(revealed && "motion-reduce:hidden")} />
                {/* Mounted on the turn (same commit as the rotation), so a face-down card holds no text. */}
                {revealed ? <CardFace chosen={isChosen} /> : null}
              </span>
            </button>
            {/* The button's name already carries this; the caption is for sighted visitors. */}
            <span
              aria-hidden="true"
              className={cn(
                "h-4 text-center text-[0.6875rem] leading-4 whitespace-nowrap sm:text-xs",
                isChosen ? "font-semibold text-ink" : "text-ink-soft",
                // With motion, each caption fades in once its card has turned.
                revealed && "motion-safe:animate-[corvane-fade-in_360ms_ease-out_both]",
                revealed && (isChosen ? "motion-safe:[animation-delay:520ms]" : "motion-safe:[animation-delay:1000ms]"),
              )}
            >
              {revealed ? (isChosen ? copy.yourCard : copy.sameReward) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
