import { VANE_CENTER, VANE_PATH } from "@/components/brand/VaneIcon";
import { cn } from "@/lib/cn";

import { FULL_STICK, StickArt, useSvgId } from "./StickRender";

/**
 * Travel Pouch packshot: a flat canvas pouch in sand, standing, with a kelp
 * binding along the open top, stitched seams, a small woven vane tab in the
 * side seam and three sticks standing in it (only their caps show).
 * Aspect 4 : 5 (viewBox 400 x 500), like the packshot photo slot.
 */

export interface PouchRenderProps {
  /** Sizing; replaces the default "h-full w-auto". */
  className?: string;
  /** Hide from assistive technology when a caption already describes it. */
  decorative?: boolean;
}

/** Sticks in the pouch: x, base y, lean. They push the canvas out a little (see BULGES). */
const STICKS = [
  { x: 146, y: 404, lean: -4 },
  { x: 254, y: 400, lean: 4 },
  { x: 200, y: 392, lean: 0 },
] as const;

const STICK_SCALE = 0.78;

// Front panel: almost straight open top, slightly full sides, soft bottom corners.
const FRONT = "M66 206Q200 211 334 206Q340 320 337 418Q336 444 310 446Q200 452 90 446Q64 444 63 418Q60 320 66 206Z";
// Kelp binding folded over the top edge.
const BINDING = "M66 206Q200 211 334 206L334.4 232Q200 237 65.6 232Z";
// Top edge of the back panel, just visible behind the sticks.
const BACK = "M70 200Q200 194 330 200L334 206Q200 211 66 206Z";

export function PouchRender({ className, decorative = false }: PouchRenderProps) {
  const id = useSvgId("pouch");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 500"
      className={cn("block", className ?? "h-full w-auto")}
      {...(decorative
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": "Travel Pouch: stitched canvas pouch with three sticks" })}
    >
      <defs>
        <linearGradient id={`${id}-canvas`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D3C7B1" />
          <stop offset="0.12" stopColor="#E3D9C6" />
          <stop offset="0.38" stopColor="#ECE4D5" />
          <stop offset="0.7" stopColor="#E4DAC8" />
          <stop offset="0.92" stopColor="#D8CCB6" />
          <stop offset="1" stopColor="#C9BCA4" />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.1" />
          <stop offset="0.14" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        {/* Soft vertical bulges where the sticks press against the canvas. */}
        <radialGradient id={`${id}-bulge`} cx="0.42" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-binding`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#223830" />
          <stop offset="0.35" stopColor="#38594C" />
          <stop offset="0.75" stopColor="#2E4A3F" />
          <stop offset="1" stopColor="#21362D" />
        </linearGradient>
        <linearGradient id={`${id}-bindingShade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        {/* Canvas weave */}
        <pattern id={`${id}-weave`} width="3" height="3" patternUnits="userSpaceOnUse">
          <path d="M0 .75H3" stroke="#5f5544" strokeOpacity="0.06" strokeWidth="0.7" />
          <path d="M.75 0V3" stroke="#fff" strokeOpacity="0.09" strokeWidth="0.6" />
        </pattern>
        <radialGradient id={`${id}-floor`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-front`}>
          <path d={FRONT} />
        </clipPath>
      </defs>

      {/* Drawn at y 160 to 450; scaled up a little and centred in the 4:5 frame. */}
      <g transform="translate(200 262) scale(1.08) translate(-200 -305)">
        <ellipse cx="200" cy="447" rx="172" ry="18" fill={`url(#${id}-floor)`} />

        {/* Back panel edge and the dark slit of the opening */}
        <path d={BACK} fill="#1E3229" />

        {STICKS.map(({ x, y, lean }, i) => (
          <g key={x} transform={`translate(${x} ${y}) rotate(${lean}) scale(${STICK_SCALE})`}>
            <StickArt id={`${id}-s${i}`} ringColor="#202327" geometry={FULL_STICK} shadow={false} />
          </g>
        ))}

        {/* Front panel */}
        <path d={FRONT} fill={`url(#${id}-canvas)`} />
        <g clipPath={`url(#${id}-front)`}>
          <rect x="56" y="200" width="290" height="260" fill={`url(#${id}-weave)`} />
          {STICKS.map(({ x }) => (
            <ellipse key={x} cx={x} cy="318" rx="30" ry="104" fill={`url(#${id}-bulge)`} />
          ))}
          <rect x="56" y="200" width="290" height="260" fill={`url(#${id}-depth)`} />
          {/* Shadow under the binding, then the binding itself */}
          <path d="M65.6 232Q200 237 334.4 232L334.5 240Q200 245 65.5 240Z" fill="#000" opacity="0.07" />
          <path d={BINDING} fill={`url(#${id}-binding)`} />
          <path d={BINDING} fill={`url(#${id}-bindingShade)`} />
          <path d={BINDING} fill={`url(#${id}-weave)`} opacity="0.7" />
        </g>

        {/* Stitching: along the binding, then down the sides and across the bottom */}
        <g fill="none" strokeLinecap="round" strokeDasharray="4.5 3.2" strokeWidth="1.1">
          <path d="M72 213.5Q200 218.5 328 213.5" stroke="#E9E1D2" strokeOpacity="0.7" />
          <path d="M72 226Q200 231 328 226" stroke="#E9E1D2" strokeOpacity="0.7" />
          <path
            d="M75 246Q72 330 74.5 414Q75.5 434 94 435.5Q200 441 306 435.5Q324.5 434 325.5 414Q328 330 325 246"
            stroke="#8f826b"
            strokeOpacity="0.65"
          />
        </g>
        <path d={FRONT} fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="1" />

        {/* Woven vane tab sewn into the right side seam */}
        <g transform="translate(336 262)">
          <path d="M-4 0H20Q24 0 24 4V42Q24 46 20 46H-4Z" fill="#000" opacity="0.14" transform="translate(1.5 2.5)" />
          <path d="M-4 0H20Q24 0 24 4V42Q24 46 20 46H-4Z" fill="#2E4A3F" />
          <path d="M-4 0H20Q24 0 24 4V42Q24 46 20 46H-4Z" fill={`url(#${id}-bindingShade)`} />
          <path d="M2.5 4V42" stroke="#E9E1D2" strokeOpacity="0.5" strokeWidth="0.9" strokeDasharray="3 2.2" />
          <path
            d={VANE_PATH}
            fill="#EEE6D8"
            transform={`translate(${13.5 - VANE_CENTER.x * 0.52} ${23 - VANE_CENTER.y * 0.52}) scale(0.52)`}
          />
        </g>
      </g>
    </svg>
  );
}
