import type { ComponentType, ReactNode } from "react";

import type { HowItWorksStep } from "@/content/home";
import { cn } from "@/lib/cn";

/**
 * Line icons for the homepage sections, drawn for CORVANE (not from an icon
 * set). 24 x 24 grid, 1.5 stroke in currentColor, round caps and joins, about
 * 2 units of padding, so they sit next to lucide-react icons at the same size.
 *
 * Decorative by default (aria-hidden). Pass `title` to give one an accessible
 * name. Size and colour come from `className` (default "size-6").
 */

export interface LineIconProps {
  className?: string;
  /** Accessible name. Without it the icon is hidden from screen readers. */
  title?: string;
}

export type LineIcon = ComponentType<LineIconProps>;

function IconBase({ className, title, children }: LineIconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className ?? "size-6")}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: false })}
    >
      {children}
    </svg>
  );
}

/** Twist: the stick with its cologne turned up, and turning arrows around it. */
export function TwistIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      {/* Cologne, turned up out of the tube (slanted like a twist-up stick) */}
      <path d="M10.25 9V5.9l3.5-1.65V9" />
      {/* Tube with the scent ring near the base */}
      <rect x="8.75" y="9" width="6.5" height="11" rx="1" />
      <path d="M8.75 17.25h6.5" />
      {/* Turning arrows: down on the right, up on the left */}
      <path d="M18.5 10.5a6.5 6.5 0 0 1 0 7" />
      <path d="m17.1 16.6 1.4 1.4 1.6-1.3" />
      <path d="M5.5 17.5a6.5 6.5 0 0 1 0-7" />
      <path d="M6.9 11.4 5.5 10l-1.6 1.3" />
    </IconBase>
  );
}

/** Swipe: the stick at an angle, drawn across a line of skin. */
export function SwipeIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <g transform="rotate(40 12 10)">
        {/* Cologne */}
        <path d="M10.6 6.2V3.9l2.8-1.3v3.6" />
        {/* Tube with the scent ring */}
        <rect x="9.4" y="6.2" width="5.2" height="9" rx="0.9" />
        <path d="M9.4 13h5.2" />
      </g>
      {/* The swipe: a trace on the skin, plus two motion lines */}
      <path d="M3.5 19.25c2.5-1.1 5-1.4 7.75-.9" />
      <path d="M3 15.5h2.5M2.75 12.25h1.75" />
    </IconBase>
  );
}

/** Go: the stick, cap on, back in a stitched pocket. */
export function GoIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      {/* Cap of the stick, above the pocket edge */}
      <path d="M10 9.5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5" />
      {/* Pocket */}
      <path d="M5 9.5h14v7.25L12 20.5l-7-3.75Z" />
      {/* Stitching */}
      <path d="M7.25 11.75h9.5v3.6L12 17.9l-4.75-2.55Z" strokeDasharray="1 1.8" />
    </IconBase>
  );
}

/** Guarantee: a shield with a tick. */
export function ShieldIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.25 19 6v5.25c0 4.35-2.9 7.9-7 9.5-4.1-1.6-7-5.15-7-9.5V6Z" />
      <path d="m9 12 2.1 2.1 4-4.1" />
    </IconBase>
  );
}

/** Refund or swap: two arrows turning around each other. */
export function SwapIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <path d="M5.5 10a6.75 6.75 0 0 1 12.2-2.75" />
      <path d="M18 4.25v3.25h-3.25" />
      <path d="M18.5 14a6.75 6.75 0 0 1-12.2 2.75" />
      <path d="M6 19.75V16.5h3.25" />
    </IconBase>
  );
}

/** Return: a parcel going back. */
export function ReturnIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.5 6.75 12 5l7 3.5v7.75L12 19.75l-7-3.5V12" />
      <path d="m5 8.5 7 3.5 7-3.5M12 12v7.75" />
      <path d="M8.75 4.25H3.5M5.25 2.5 3.5 4.25 5.25 6" />
    </IconBase>
  );
}

/** Reviews: a speech bubble with two lines of text. No stars. */
export function ReviewIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <path d="M5.5 5h13A1.5 1.5 0 0 1 20 6.5v8.5a1.5 1.5 0 0 1-1.5 1.5H11l-4.25 3.25V16.5H5.5A1.5 1.5 0 0 1 4 15V6.5A1.5 1.5 0 0 1 5.5 5Z" />
      <path d="M8 9.25h8M8 12.25h5" />
    </IconBase>
  );
}

/** Play: an open triangle, for film slots. */
export function PlayIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.5 5.75v12.5L18.5 12Z" />
    </IconBase>
  );
}

/** A plain arrow to the right, for text links. */
export function ArrowRightIcon(props: LineIconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 12h15M14 6.5l5.5 5.5-5.5 5.5" />
    </IconBase>
  );
}

/** The icon of each How it works step, by step id (content/home.ts). */
export const stepIcons: Record<HowItWorksStep["id"], LineIcon> = {
  twist: TwistIcon,
  swipe: SwipeIcon,
  go: GoIcon,
};
