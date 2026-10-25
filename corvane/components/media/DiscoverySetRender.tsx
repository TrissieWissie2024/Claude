import { VANE_CENTER, VANE_PATH } from "@/components/brand/VaneIcon";
import { WORDMARK_HEIGHT, WORDMARK_PATH, WORDMARK_WIDTH } from "@/components/brand/Wordmark";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

import { MINI_STICK, StickArt, useSvgId, type StickGeometry } from "./StickRender";

/**
 * Discovery Set packshot: six 3 g mini sticks lying in a slim tray, seen from
 * above, each with the ring colour of its scent; the lid lies behind it.
 * Aspect 4 : 5 (viewBox 400 x 500), like the packshot photo slot.
 */

export interface DiscoveryScent {
  ringColor: string;
  name: string;
}

/**
 * Ring colours in catalogue order, used when no scents are passed. Keep in
 * sync with content/products.ts (pass `scents` from the catalog where you can).
 */
export const DEFAULT_DISCOVERY_SCENTS: readonly DiscoveryScent[] = [
  { name: "North Swell", ringColor: "#6FA8C7" },
  { name: "Drift & Ember", ringColor: "#C26A3D" },
  { name: "Lantern Smoke", ringColor: "#8B2E2E" },
  { name: "Iron Coast", ringColor: "#8C9399" },
  { name: "Dune Fig", ringColor: "#7E9A5B" },
  { name: "Harbour Tea", ringColor: "#A9844F" },
];

export interface DiscoverySetRenderProps {
  /** The six scents (ring colour and name), in display order. Default: the launch range. */
  scents?: readonly DiscoveryScent[];
  /** Sizing; replaces the default "h-full w-auto". */
  className?: string;
  /** Hide from assistive technology when a caption already describes it. */
  decorative?: boolean;
  /** Leave out the printed text on the lid (thumbnails, whose button has its own name). */
  textless?: boolean;
}

/** Seen from straight above, the ends of a lying stick are almost flat. */
const LYING_MINI: StickGeometry = { ...MINI_STICK, ry: 1.4 };

const SLOT_X = [-110, -66, -22, 22, 66, 110];

export function DiscoverySetRender({
  scents = DEFAULT_DISCOVERY_SCENTS,
  className,
  decorative = false,
  textless = false,
}: DiscoverySetRenderProps) {
  const id = useSvgId("disc");
  const six = scents.slice(0, 6);
  const wmWidth = 150;
  const wmScale = wmWidth / WORDMARK_WIDTH;
  const wmHeight = WORDMARK_HEIGHT * wmScale;
  const lid = site.renders.discoverySetLid;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 500"
      className={cn("block", className ?? "h-full w-auto")}
      {...(decorative
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": site.renders.discoverySet(six.map((s) => s.name).join(", ")) })}
    >
      <defs>
        <linearGradient id={`${id}-box`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A4054" />
          <stop offset="0.55" stopColor="#0F2733" />
          <stop offset="1" stopColor="#0B1E28" />
        </linearGradient>
        <linearGradient id={`${id}-insert`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F1EADD" />
          <stop offset="1" stopColor="#E2D8C6" />
        </linearGradient>
        <linearGradient id={`${id}-slot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CDC1AB" />
          <stop offset="0.12" stopColor="#D9CEBA" />
          <stop offset="1" stopColor="#DDD3C0" />
        </linearGradient>
        {/*
          Soft drop shadow under the lid and the tray: a radial falloff on a rect a little larger
          than the box, instead of a blur filter (cheaper to paint, e.g. while a card's hover
          shadow animates). The box covers the centre; only the soft edge shows.
        */}
        <radialGradient id={`${id}-drop`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="1" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0.85" />
          <stop offset="0.9" stopColor="#000" stopOpacity="0.3" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lid, behind */}
      <g transform="translate(200 150) rotate(-4)">
        <rect x="-156" y="-112" width="312" height="224" fill={`url(#${id}-drop)`} opacity="0.28" transform="translate(4 10)" />
        <rect x="-136" y="-92" width="272" height="184" rx="6" fill={`url(#${id}-box)`} />
        <rect x="-127" y="-83" width="254" height="166" rx="3" fill="none" stroke="#F7F5F1" strokeOpacity="0.14" strokeWidth="0.8" />
        <path
          d={VANE_PATH}
          fill="#F7F5F1"
          transform={`translate(${-VANE_CENTER.x} ${-46 - VANE_CENTER.y})`}
        />
        <path
          d={WORDMARK_PATH}
          fill="#F7F5F1"
          transform={`translate(${-wmWidth / 2} ${-12}) scale(${wmScale})`}
        />
        {textless ? null : (
          <>
            <text
              x="0"
              y={-12 + wmHeight + 24}
              textAnchor="middle"
              className="font-sans"
              fontSize="8.5"
              fontWeight="600"
              letterSpacing="2.6"
              fill="#B9C4C9"
            >
              {lid.title.toUpperCase()}
            </text>
            <text x="0" y={-12 + wmHeight + 40} textAnchor="middle" className="font-sans" fontSize="7" letterSpacing="1.6" fill="#B9C4C9" fillOpacity="0.75">
              {/* Words in capitals, the unit in lower case: "3 g", never "3 G". */}
              {`${lid.contents.toUpperCase()} · ${lid.size}`}
            </text>
          </>
        )}
      </g>

      {/* Tray, in front */}
      <g transform="translate(200 352) rotate(1.5)">
        <rect x="-170" y="-124" width="340" height="248" fill={`url(#${id}-drop)`} opacity="0.3" transform="translate(3 12)" />
        <rect x="-150" y="-104" width="300" height="208" rx="8" fill={`url(#${id}-box)`} />
        <rect x="-142" y="-96" width="284" height="192" rx="4" fill={`url(#${id}-insert)`} />
        <rect x="-142" y="-96" width="284" height="192" rx="4" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.2" />
        {SLOT_X.map((x, i) => {
          const scent = six[i];
          return (
            <g key={x} transform={`translate(${x} 0)`}>
              <rect x="-20" y="-82" width="40" height="164" rx="7" fill={`url(#${id}-slot)`} />
              <rect x="-20" y="-82" width="40" height="164" rx="7" fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="0.8" />
              {scent ? (
                <>
                  {/* Contact shadow: a soft-cornered rect (no blur filter; at this size the edge reads as soft). */}
                  <rect x="-16" y="-72" width="36" height="152" rx="5" fill="#000" opacity="0.24" />
                  <g transform="translate(0 76)">
                    <StickArt id={`${id}-m${i}`} ringColor={scent.ringColor} geometry={LYING_MINI} shadow={false} />
                  </g>
                </>
              ) : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
