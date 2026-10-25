import type { HowItWorksStep } from "@/content/home";
import { FULL_STICK, StickArt, StickShadow, useSvgId } from "@/components/media/StickRender";
import { cn } from "@/lib/cn";

/**
 * The three How it works steps drawn with the product itself (StickArt, the
 * same stick as the hero and the cards), not with generic icons:
 * - twist: the stick open, cologne turned up, a turning arrow around the base;
 * - swipe: the open stick at an angle, with the soft trail of its swipe;
 * - go: the stick closed, cap on, sliding into a stitched pocket.
 *
 * All three share one viewBox and one scale, so the stick is the same size in
 * every tile. Made for the sand tile (light surfaces). Decorative: the step
 * title and text say what happens.
 */

export interface StepRenderProps {
  step: HowItWorksStep["id"];
  /** Ring colour of the scent shown (hex). */
  ringColor: string;
  className?: string;
}

/** 256 x 320 (4 : 5), the stick base near the bottom; tall enough for the closed stick. */
const VIEWBOX = "-128 -298 256 320";

/** Turning arrow and trail colour: ink, quiet. */
const LINE = "#101418";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function StepRender({ step, ringColor, className }: StepRenderProps) {
  const id = useSvgId(`step-${step}`);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={cn("block", className ?? "h-full w-full")}
    >
      {step === "twist" ? <Twist id={id} ringColor={ringColor} /> : null}
      {step === "swipe" ? <Swipe id={id} ringColor={ringColor} /> : null}
      {step === "go" ? <Go id={id} ringColor={ringColor} /> : null}
    </svg>
  );
}

function Twist({ id, ringColor }: { id: string; ringColor: string }) {
  // Turning arrow: an ellipse around the twist base (between the floor and the ring), seen from
  // slightly above. The back half runs behind the tube, the front half in front with the arrowhead.
  const cy = -9;
  const rx = 50;
  const ry = 11;
  // End of the front arc (x = 41 on the ellipse) and its arrowhead, along the tangent there.
  const end = { x: 41, y: round(cy + ry * Math.sqrt(1 - (41 / rx) ** 2)) };
  return (
    <g transform="translate(0 -6)">
      <path
        d={`M${-rx} ${cy}A${rx} ${ry} 0 0 1 ${rx} ${cy}`}
        stroke={LINE}
        strokeOpacity="0.22"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <StickArt id={`${id}-s`} ringColor={ringColor} variant="open" geometry={FULL_STICK} />
      <path
        d={`M${-rx} ${cy}A${rx} ${ry} 0 0 0 ${end.x} ${end.y}`}
        stroke={LINE}
        strokeOpacity="0.72"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      {/* Arrowhead at the right end of the front arc, pointing along the turn. */}
      <path
        d={`M${round(end.x - 4.4)} ${round(end.y + 8.6)}L${end.x} ${end.y}L${round(end.x - 9.6)} ${round(end.y + 1.2)}`}
        stroke={LINE}
        strokeOpacity="0.72"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
    </g>
  );
}

function Swipe({ id, ringColor }: { id: string; ringColor: string }) {
  // The open stick leans 32 degrees to the right around its base; the dome ends up top right.
  // Its trail sweeps in from the left to the dome: a pale band (the cologne left on skin) plus
  // two fine motion lines.
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-trail`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        d="M-108 -168C-62 -196 6 -212 58 -210"
        stroke={`url(#${id}-trail)`}
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M-100 -140C-70 -158 -40 -168 -8 -172"
        stroke={LINE}
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <path
        d="M-88 -118C-66 -130 -44 -136 -22 -139"
        stroke={LINE}
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <g transform="translate(-50 -6)">
        <StickShadow />
        <g transform="rotate(32)">
          <StickArt id={`${id}-s`} ringColor={ringColor} variant="open" geometry={FULL_STICK} shadow={false} />
        </g>
      </g>
    </g>
  );
}

function Go({ id, ringColor }: { id: string; ringColor: string }) {
  // The closed stick slides into a patch pocket: the pocket is drawn in front of it, so only the
  // cap and the top of the tube show above the pocket edge.
  const top = -116;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-pocket`} x1="0" x2="0.35" y1="0" y2="1">
          <stop offset="0" stopColor="#E6DCCB" />
          <stop offset="1" stopColor="#D8CCB5" />
        </linearGradient>
        <linearGradient id={`${id}-lip`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="translate(4 4) rotate(6 0 -146)">
        <StickArt id={`${id}-s`} ringColor={ringColor} variant="closed" geometry={FULL_STICK} shadow={false} />
      </g>
      {/* Pocket: straight top, slightly tapering sides, a soft point at the bottom. */}
      <path
        d={`M-94 ${top}H94L86 8L0 18L-86 8Z`}
        fill={`url(#${id}-pocket)`}
        stroke="#000"
        strokeOpacity="0.07"
        strokeWidth="1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Shadow of the pocket edge on the stick, and the folded hem. */}
      <path d={`M-94 ${top}H94V${top + 14}H-94Z`} fill={`url(#${id}-lip)`} />
      <path
        d={`M-94 ${top}H94`}
        stroke="#FFFFFF"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M-86 ${top + 12}H86M-86 ${top + 12}L-79 1L0 10L79 1L86 ${top + 12}`}
        stroke={LINE}
        strokeOpacity="0.3"
        strokeWidth="1.25"
        strokeDasharray="4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
    </g>
  );
}
