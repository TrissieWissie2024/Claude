/**
 * Keyframes for the promo bar: a short fade with a 3 px rise when a message
 * appears. Hoisted into <head> and deduped by React 19 (same pattern as
 * components/ui/MotionStyles). Only applied behind `motion-safe:`.
 */

const KEYFRAMES =
  "@keyframes corvane-promo-in{from{opacity:0;transform:translate3d(0,3px,0)}to{opacity:1;transform:none}}";

/** Class for an element that fades in when it mounts. */
export const promoFadeIn = "motion-safe:animate-[corvane-promo-in_480ms_cubic-bezier(0.32,0.72,0,1)]";

export function PromoMotion() {
  return (
    <style href="corvane-promo-motion" precedence="default">
      {KEYFRAMES}
    </style>
  );
}
