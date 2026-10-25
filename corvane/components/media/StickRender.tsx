import { useId } from "react";

import { VANE_CENTER, VANE_GRID, VANE_PATH } from "@/components/brand/VaneIcon";
import { cn } from "@/lib/cn";

/**
 * Product render of the CORVANE solid cologne stick (brief §4 and §5): matte
 * black aluminium tube, cap with a fine seam, engraved vane, and a coloured
 * ring near the base in the scent's ring colour.
 *
 * Drawing model: every part is painted in a flat base colour first (aluminium,
 * ring, engraving), then one cylindrical shading overlay runs over the whole
 * side, so tube, ring and engraving share the same light (soft key light from
 * the left, a faint reflected light on the right). The tops and seams are front
 * halves of ellipses, as seen from slightly above.
 *
 * Coordinates: the stick stands with the centre of its base at (0, 0) and
 * grows upwards (negative y). <StickArt> draws one stick in these local
 * coordinates; GroupRender, DiscoverySetRender and PouchRender place it with a
 * transform. Gradient ids come from React useId(), so any number of renders can
 * share a page.
 */

export type StickVariant = "closed" | "open";

export interface StickGeometry {
  /** Tube diameter. */
  width: number;
  /** Vertical radius of the top and seam ellipses (the viewing angle). */
  ry: number;
  /** y of the bottom and top edge of the coloured ring. */
  ringBottom: number;
  ringTop: number;
  /** y of the seam between cap and body. */
  seam: number;
  /** y of the top face of the cap. */
  top: number;
  /** Height of the solid cologne above the tube when open, and of its dome. */
  wax: number;
  dome: number;
  /** Centre (y) and box size of the engraved vane. */
  engraveY: number;
  engraveSize: number;
  /** Fine grip lines on the twist base (only at full size). */
  knurl: boolean;
}

/** The 15 g stick. Closed it is 293 units tall including the top face; 1 : 4.9. */
export const FULL_STICK: StickGeometry = {
  width: 60,
  ry: 5,
  ringBottom: -17,
  ringTop: -30,
  seam: -176,
  top: -288,
  wax: 48,
  dome: 8,
  engraveY: -122,
  engraveSize: 30,
  knurl: true,
};

/** The 3 g mini stick of the Discovery Set; 1 : 4.4. */
export const MINI_STICK: StickGeometry = {
  width: 34,
  ry: 3,
  ringBottom: -10,
  ringTop: -19,
  seam: -88,
  top: -150,
  wax: 22,
  dome: 5,
  engraveY: -54,
  engraveSize: 17,
  knurl: false,
};

/** Base colours of the matte black anodised aluminium and the solid cologne. */
const ALU = "#202327";
const ENGRAVING = "#41474e";
const WAX = "#ECE5D5";

/** An id from React useId() that is safe inside url(#...). */
export function useSvgId(prefix: string): string {
  const id = useId();
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Region between the front arcs at yTop and yBottom (one band of a cylinder). */
function band(yTop: number, yBottom: number, rx: number, ry: number): string {
  return `M${-rx} ${yTop}A${rx} ${ry} 0 0 0 ${rx} ${yTop}V${yBottom}A${rx} ${ry} 0 0 1 ${-rx} ${yBottom}Z`;
}

/** Front (lower) half of the ellipse at y, left to right. */
function frontArc(y: number, rx: number, ry: number): string {
  return `M${-rx} ${y}A${rx} ${ry} 0 0 0 ${rx} ${y}`;
}

/** Back (upper) half of the ellipse at y, left to right. */
function backArc(y: number, rx: number, ry: number): string {
  return `M${-rx} ${y}A${rx} ${ry} 0 0 1 ${rx} ${y}`;
}

/** Vertical grip lines on the twist base, following the curvature. */
function knurlPath(g: StickGeometry): string {
  const r = g.width / 2;
  let d = "";
  for (let deg = -72; deg <= 72; deg += 8) {
    const rad = (deg * Math.PI) / 180;
    const x = round(r * Math.sin(rad));
    const off = g.ry * Math.cos(rad);
    d += `M${x} ${round(g.ringBottom + off + 1.6)}V${round(off - 1.6)}`;
  }
  return d;
}

export interface StickArtProps {
  /** Unique id prefix for gradients (from useSvgId). */
  id: string;
  ringColor: string;
  variant?: StickVariant;
  geometry?: StickGeometry;
  /** Cool edge highlight so the black tube reads on deep backgrounds. */
  rimLight?: boolean;
  /** Soft floor shadow under the base. */
  shadow?: boolean;
}

/** One stick in local coordinates (base centre at 0,0). Use inside an <svg>. */
export function StickArt({
  id,
  ringColor,
  variant = "closed",
  geometry: g = FULL_STICK,
  rimLight = false,
  shadow = true,
}: StickArtProps) {
  const r = g.width / 2;
  const ry = g.ry;
  const open = variant === "open";
  const sideTop = open ? g.seam : g.top;
  const side = band(sideTop, 0, r, ry);

  // Solid cologne (open variant): fills the tube opening minus a thin dark gap.
  const holeR = r - g.width * 0.045;
  const holeRy = (ry * holeR) / r;
  const waxR = holeR - g.width * 0.012;
  const waxRy = (ry * waxR) / r;
  const waxTop = g.seam - g.wax;

  const s = g.engraveSize / VANE_GRID;
  const iconAt = (dy: number) =>
    `translate(${round(-VANE_CENTER.x * s)} ${round(g.engraveY - VANE_CENTER.y * s + dy)}) scale(${round(s * 1000) / 1000})`;
  const lip = g.width / 110;

  const ids = {
    shade: `${id}-shade`,
    ao: `${id}-ao`,
    rim: `${id}-rim`,
    sheen: `${id}-sheen`,
    top: `${id}-top`,
    floor: `${id}-floor`,
    contact: `${id}-contact`,
    waxShade: `${id}-wax`,
    waxAo: `${id}-waxao`,
    dome: `${id}-dome`,
  };

  return (
    <g>
      <defs>
        {/* Cylindrical shading over the whole side: key light left, reflected light right. */}
        <linearGradient id={ids.shade} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.62" />
          <stop offset="0.07" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.56" stopColor="#000" stopOpacity="0" />
          <stop offset="0.78" stopColor="#000" stopOpacity="0.26" />
          <stop offset="0.9" stopColor="#000" stopOpacity="0.46" />
          <stop offset="0.955" stopColor="#000" stopOpacity="0.3" />
          <stop offset="1" stopColor="#000" stopOpacity="0.66" />
        </linearGradient>
        {/* Top a touch brighter, occlusion towards the floor. */}
        <linearGradient id={ids.ao} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.94" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        {/* Satin sheen on the coloured ring (anodised, a touch brighter than the tube). */}
        <linearGradient id={ids.sheen} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.18" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.29" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.rim} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#D3E4EC" stopOpacity="0.8" />
          <stop offset="0.05" stopColor="#D3E4EC" stopOpacity="0" />
          <stop offset="0.95" stopColor="#D3E4EC" stopOpacity="0" />
          <stop offset="1" stopColor="#D3E4EC" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={ids.top} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#40454b" />
          <stop offset="0.55" stopColor="#272a2f" />
          <stop offset="1" stopColor="#16181b" />
        </linearGradient>
        <radialGradient id={ids.floor}>
          <stop offset="0" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.contact}>
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {open ? (
          <>
            <linearGradient id={ids.waxShade} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#5b5347" stopOpacity="0.5" />
              <stop offset="0.12" stopColor="#5b5347" stopOpacity="0.14" />
              <stop offset="0.3" stopColor="#fff" stopOpacity="0.3" />
              <stop offset="0.46" stopColor="#fff" stopOpacity="0.06" />
              <stop offset="0.72" stopColor="#5b5347" stopOpacity="0.12" />
              <stop offset="0.93" stopColor="#5b5347" stopOpacity="0.32" />
              <stop offset="1" stopColor="#5b5347" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id={ids.waxAo} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id={ids.dome} cx="0.36" cy="0.3" r="0.85">
              <stop offset="0" stopColor="#FCFAF5" />
              <stop offset="0.55" stopColor="#ECE5D6" />
              <stop offset="1" stopColor="#D2C8B5" />
            </radialGradient>
          </>
        ) : null}
      </defs>

      {shadow ? (
        <>
          <ellipse cx="0" cy={round(ry * 0.6)} rx={round(r * 1.7)} ry={round(ry * 2)} fill={`url(#${ids.floor})`} />
          <ellipse cx="0" cy={round(ry * 0.35)} rx={round(r * 1.06)} ry={round(ry * 1.15)} fill={`url(#${ids.contact})`} />
        </>
      ) : null}

      {/* Base colours */}
      <path d={side} fill={ALU} />
      <path d={band(g.ringTop, g.ringBottom, r, ry)} fill={ringColor} />

      {/* Engraved vane: lit lower lip, shadowed upper lip, slightly lighter floor. */}
      <g>
        <path d={VANE_PATH} transform={iconAt(lip)} fill="#fff" fillOpacity="0.12" />
        <path d={VANE_PATH} transform={iconAt(-lip * 0.8)} fill="#000" fillOpacity="0.5" />
        <path d={VANE_PATH} transform={iconAt(0)} fill={ENGRAVING} />
      </g>

      {g.knurl ? <path d={knurlPath(g)} stroke="#000" strokeOpacity="0.32" strokeWidth="0.55" fill="none" /> : null}

      {/* Shading over everything on the side */}
      <path d={side} fill={`url(#${ids.shade})`} />
      <path d={side} fill={`url(#${ids.ao})`} />

      <path d={band(g.ringTop, g.ringBottom, r, ry)} fill={`url(#${ids.sheen})`} />

      {/* Ring edges */}
      <path d={frontArc(g.ringTop, r, ry)} stroke="#000" strokeOpacity="0.5" strokeWidth="0.7" fill="none" />
      <path d={frontArc(g.ringBottom, r, ry)} stroke="#000" strokeOpacity="0.55" strokeWidth="0.7" fill="none" />
      <path d={frontArc(g.ringTop + 0.9, r, ry)} stroke="#fff" strokeOpacity="0.12" strokeWidth="0.5" fill="none" />

      {open ? (
        <>
          {/* Tube opening: wall face, dark inside */}
          <ellipse cx="0" cy={g.seam} rx={r} ry={ry} fill={`url(#${ids.top})`} />
          <ellipse cx="0" cy={g.seam} rx={round(holeR)} ry={round(holeRy)} fill="#060708" />
          {/* Solid cologne, twisted up */}
          <path d={band(waxTop, g.seam, round(waxR), round(waxRy))} fill={WAX} />
          <path d={band(waxTop, g.seam, round(waxR), round(waxRy))} fill={`url(#${ids.waxShade})`} />
          <path
            d={band(round(g.seam - g.wax * 0.16), g.seam, round(waxR), round(waxRy))}
            fill={`url(#${ids.waxAo})`}
          />
          <path
            d={`M${round(-waxR)} ${waxTop}A${round(waxR)} ${g.dome} 0 0 1 ${round(waxR)} ${waxTop}A${round(waxR)} ${round(waxRy)} 0 0 1 ${round(-waxR)} ${waxTop}Z`}
            fill={`url(#${ids.dome})`}
          />
          <path
            d={frontArc(waxTop, round(waxR), round(waxRy))}
            stroke="#fff"
            strokeOpacity="0.45"
            strokeWidth="0.6"
            fill="none"
          />
          {/* Cut edge of the tube catches the light */}
          <path d={frontArc(g.seam, r, ry)} stroke="#fff" strokeOpacity="0.16" strokeWidth="0.8" fill="none" />
        </>
      ) : (
        <>
          {/* Cap top face with a fine bevel highlight */}
          <ellipse cx="0" cy={g.top} rx={r} ry={ry} fill={`url(#${ids.top})`} />
          <path d={frontArc(g.top, r, ry)} stroke="#fff" strokeOpacity="0.16" strokeWidth="0.7" fill="none" />
          {/* Seam between cap and body */}
          <path d={frontArc(g.seam - 0.9, r, ry)} stroke="#fff" strokeOpacity="0.06" strokeWidth="0.6" fill="none" />
          <path d={frontArc(g.seam, r, ry)} stroke="#050607" strokeOpacity="0.95" strokeWidth="0.9" fill="none" />
          <path d={frontArc(g.seam + 1, r, ry)} stroke="#fff" strokeOpacity="0.08" strokeWidth="0.6" fill="none" />
        </>
      )}

      {rimLight ? (
        <>
          <path d={side} fill={`url(#${ids.rim})`} />
          {/* Back edge of the cap; when open the pale cologne already reads on dark. */}
          {open ? null : (
            <path d={backArc(sideTop, r, ry)} stroke="#D3E4EC" strokeOpacity="0.55" strokeWidth="0.8" fill="none" />
          )}
        </>
      ) : null}
    </g>
  );
}

export interface StickRenderProps {
  /** Ring colour of the scent (hex). */
  ringColor: string;
  /** Scent name; gives the render an accessible name. Without it the render is decorative. */
  name?: string;
  /** Sizing; replaces the default "h-full w-auto". The viewBox is 1 : 3. */
  className?: string;
  /** "open" shows the cap off and the cologne twisted up. */
  variant?: StickVariant;
  /** Lean in degrees around the centre of the stick, clamped to -8 ... 8. */
  angle?: number;
  /** Cool edge highlight for deep backgrounds. */
  rimLight?: boolean;
}

/** Viewbox of a single stick: 1 : 3, base on the same line for both variants. */
export const STICK_VIEWBOX = "-52 -298 104 312";

/** A single 15 g stick. Same proportions and position for every scent. */
export function StickRender({ ringColor, name, className, variant = "closed", angle = 0, rimLight = false }: StickRenderProps) {
  const id = useSvgId("stick");
  const lean = Math.max(-8, Math.min(8, angle));
  const label = name ? `${name} solid cologne stick${variant === "open" ? " with the cap off" : ""}` : null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={STICK_VIEWBOX}
      className={cn("block", className ?? "h-full w-auto")}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
    >
      {lean ? (
        <>
          <StickShadow id={`${id}-shadow`} />
          <g transform={`rotate(${lean} 0 -145)`}>
            <StickArt id={id} ringColor={ringColor} variant={variant} rimLight={rimLight} shadow={false} />
          </g>
        </>
      ) : (
        <StickArt id={id} ringColor={ringColor} variant={variant} rimLight={rimLight} />
      )}
    </svg>
  );
}

/** A loose floor shadow, for sticks drawn without their own (leaning or lifted). */
export function StickShadow({ id, geometry: g = FULL_STICK }: { id: string; geometry?: StickGeometry }) {
  const r = g.width / 2;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy={round(g.ry * 0.8)} rx={round(r * 1.8)} ry={round(g.ry * 2)} fill={`url(#${id})`} />
    </>
  );
}
