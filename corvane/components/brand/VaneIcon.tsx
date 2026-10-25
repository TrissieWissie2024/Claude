import { cn } from "@/lib/cn";

/**
 * The CORVANE vane: a weather-vane arrow on a pivot. The arrow turns with the
 * wind; the post stands firm on its point (brief §3: cor + vane).
 *
 * Drawn on a 32 x 32 grid from straight lines and one circle, so it stays crisp
 * from 16 px (favicon) to 512 px. All sub-paths run clockwise and fill as one
 * shape (nonzero), so the mark can be drawn at partial opacity without darker
 * overlaps (used for the engraving on the stick renders).
 *
 * Ink bounds: x 2.5 to 29.5, y 7 to 25.25 (visual centre 16, 16.1).
 * The same geometry is used in app/icon.svg, app/apple-icon.png and
 * public/brand/corvane-vane.svg.
 */

export const VANE_VIEWBOX = "0 0 32 32";

/** Size of the square grid the path is drawn on. */
export const VANE_GRID = 32;

/** Visual centre of the mark on its grid, for centring it inside other shapes. */
export const VANE_CENTER = { x: 16, y: 16.125 } as const;

export const VANE_PATH =
  // Shaft
  "M7.25 10.75H22V12.75H7.25Z" +
  // Arrowhead
  "M20.5 7L29.5 11.75L20.5 16.5Z" +
  // Tail fin (chevron)
  "M2.5 7H6.25L11 11.75L6.25 16.5H2.5L7.25 11.75Z" +
  // Post
  "M15 11.75H17V25.25H15Z" +
  // Pivot
  "M16 9.15A2.6 2.6 0 0 1 16 14.35A2.6 2.6 0 0 1 16 9.15Z";

export interface VaneIconProps {
  /** Size and colour; fills with currentColor. Replaces the default "size-6". */
  className?: string;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
}

/** Inline SVG vane icon in currentColor. */
export function VaneIcon({ className, title }: VaneIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VANE_VIEWBOX}
      fill="currentColor"
      className={cn("shrink-0", className ?? "size-6")}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: false })}
    >
      <path d={VANE_PATH} />
    </svg>
  );
}
