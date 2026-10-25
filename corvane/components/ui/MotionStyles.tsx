/**
 * Keyframes for the Radix primitives (Accordion, Sheet, Modal). Rendered as a
 * React 19 hoisted <style>: React moves it into <head> and dedupes it by
 * `href`, so every primitive can render it without duplicates. Components
 * only apply these animations behind `motion-safe:`.
 */

const KEYFRAMES = [
  "@keyframes corvane-accordion-down{from{height:0}to{height:var(--radix-accordion-content-height)}}",
  "@keyframes corvane-accordion-up{from{height:var(--radix-accordion-content-height)}to{height:0}}",
  "@keyframes corvane-fade-in{from{opacity:0}to{opacity:1}}",
  "@keyframes corvane-fade-out{from{opacity:1}to{opacity:0}}",
  "@keyframes corvane-sheet-in-right{from{transform:translate3d(100%,0,0)}to{transform:translate3d(0,0,0)}}",
  "@keyframes corvane-sheet-out-right{from{transform:translate3d(0,0,0)}to{transform:translate3d(100%,0,0)}}",
  "@keyframes corvane-sheet-in-left{from{transform:translate3d(-100%,0,0)}to{transform:translate3d(0,0,0)}}",
  "@keyframes corvane-sheet-out-left{from{transform:translate3d(0,0,0)}to{transform:translate3d(-100%,0,0)}}",
  "@keyframes corvane-modal-in{from{opacity:0;transform:translate3d(0,12px,0) scale(.98)}to{opacity:1;transform:none}}",
  "@keyframes corvane-modal-out{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,8px,0) scale(.98)}}",
].join("");

export function MotionStyles() {
  return (
    <style href="corvane-ui-motion" precedence="default">
      {KEYFRAMES}
    </style>
  );
}
