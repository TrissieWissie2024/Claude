import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import { VANE_CENTER, VANE_GRID, VANE_PATH } from "@/components/brand/VaneIcon";
import { WORDMARK_HEIGHT, WORDMARK_PATH, WORDMARK_VIEWBOX, WORDMARK_WIDTH } from "@/components/brand/Wordmark";
import { FULL_STICK, MINI_STICK, STICK_VIEWBOX, type StickGeometry } from "@/components/media/StickRender";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { isStick } from "@/lib/catalog";
import { formatNotes, OG_IMAGE_SIZE } from "@/lib/seo";
import type { Product, StickProduct } from "@/lib/types";

/**
 * Open Graph images (brief §7, docs/PLAN.md §12), drawn with next/og
 * (Satori: flexbox only) at 1200 x 630:
 * - brandImageResponse(): app/opengraph-image.tsx. Deep background, the
 *   wordmark, the tagline in Fraunces and the hero trio of sticks.
 * - productImageResponse(): app/products/[slug]/opengraph-image.tsx. Fog
 *   background, product name, family and notes, a sand panel with a
 *   simplified drawing of the product and an accent in the ring colour.
 *
 * Drawings are SVG strings passed as data URIs to <img>, the most reliable
 * way to get vector art through Satori. They are simplified versions of the
 * React renders in components/media (same geometry from FULL_STICK and
 * MINI_STICK, same paint, fewer details), because those components rely on
 * shared document-wide gradients and Tailwind classes that Satori cannot
 * resolve. The SVGs contain no <text>: only the HTML layer has fonts.
 *
 * Fonts (SIL Open Font License, licences next to the files): Fraunces
 * SemiBold at optical size 72, the cut of the wordmark (Google Fonts static
 * instance, TTF), and Inter Regular and SemiBold, latin subset (Fontsource,
 * WOFF). Satori cannot read WOFF2, which is all next/font produces.
 */

/* ------------------------------------------------------------------ */
/* Tokens and fonts                                                    */
/* ------------------------------------------------------------------ */

const C = {
  ink: "#101418",
  inkSoft: "#4A5259",
  deep: "#0F2733",
  sand: "#EEE6D8",
  fog: "#F7F5F1",
  kelp: "#2E4A3F",
  mist: "#B9C4C9",
} as const;

const FONT_DIR = join(process.cwd(), "assets", "fonts");

type OgFont = { name: string; data: Buffer; weight: 400 | 600; style: "normal" };

let fontsPromise: Promise<OgFont[]> | null = null;

/** Reads the three font files once per process. Local files only: a fetch() would be uncached I/O. */
function loadFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all([
    readFile(join(FONT_DIR, "Fraunces-SemiBold.ttf")),
    readFile(join(FONT_DIR, "Inter-Regular.woff")),
    readFile(join(FONT_DIR, "Inter-SemiBold.woff")),
  ]).then(([fraunces, inter, interSemiBold]) => [
    { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
    { name: "Inter", data: inter, weight: 400, style: "normal" },
    { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
  ]);
  return fontsPromise;
}

async function respond(element: ReactElement): Promise<ImageResponse> {
  return new ImageResponse(element, { ...OG_IMAGE_SIZE, fonts: await loadFonts() });
}

/* ------------------------------------------------------------------ */
/* SVG helpers                                                         */
/* ------------------------------------------------------------------ */

function svgUri(viewBox: string, body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Region between the front arcs at yTop and yBottom (one band of a cylinder). */
function band(yTop: number, yBottom: number, rx: number, ry: number): string {
  return `M${-rx} ${yTop}A${rx} ${ry} 0 0 0 ${rx} ${yTop}V${yBottom}A${rx} ${ry} 0 0 1 ${-rx} ${yBottom}Z`;
}

function frontArc(y: number, rx: number, ry: number): string {
  return `M${-rx} ${y}A${rx} ${ry} 0 0 0 ${rx} ${y}`;
}

function backArc(y: number, rx: number, ry: number): string {
  return `M${-rx} ${y}A${rx} ${ry} 0 0 1 ${rx} ${y}`;
}

type Stop = [offset: number, color: string, opacity?: number];

function stops(list: Stop[]): string {
  return list
    .map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? "" : ` stop-opacity="${opacity}"`}/>`)
    .join("");
}

function linear(id: string, [x1, y1, x2, y2]: [number, number, number, number], list: Stop[]): string {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
}

function radial(id: string, list: Stop[], attrs = ""): string {
  return `<radialGradient id="${id}"${attrs ? ` ${attrs}` : ""}>${stops(list)}</radialGradient>`;
}

/* ------------------------------------------------------------------ */
/* Stick                                                               */
/* ------------------------------------------------------------------ */

const ALU = "#202327";
const ENGRAVING = "#6a7178";
const WAX = "#E9DFCA";

/** The stick paint of components/media/StickRender (StickDefs), once per SVG document. */
const STICK_DEFS =
  linear("shade", [0, 0, 1, 0], [
    [0, "#000", 0.55],
    [0.1, "#000", 0.2],
    [0.3, "#fff", 0.08],
    [0.5, "#000", 0],
    [0.8, "#000", 0.34],
    [0.93, "#000", 0.28],
    [1, "#000", 0.58],
  ]) +
  linear("ao", [0, 0, 0, 1], [
    [0, "#fff", 0.04],
    [0.5, "#fff", 0],
    [0.94, "#000", 0.06],
    [1, "#000", 0.28],
  ]) +
  linear("sheen", [0, 0, 1, 0], [
    [0.18, "#fff", 0],
    [0.29, "#fff", 0.2],
    [0.4, "#fff", 0],
  ]) +
  linear("rim", [0, 0, 1, 0], [
    [0, "#D3E4EC", 0.8],
    [0.05, "#D3E4EC", 0],
    [0.95, "#D3E4EC", 0],
    [1, "#D3E4EC", 0.45],
  ]) +
  linear("wall", [0, 0, 1, 1], [
    [0, "#40454b"],
    [0.55, "#272a2f"],
    [1, "#16181b"],
  ]) +
  linear("cap", [0, 0, 1, 1], [
    [0, "#5a6067"],
    [0.55, "#383c42"],
    [1, "#212428"],
  ]) +
  linear("wax", [0, 0, 1, 0], [
    [0, "#5b5347", 0.5],
    [0.12, "#5b5347", 0.14],
    [0.3, "#fff", 0.3],
    [0.46, "#fff", 0.06],
    [0.72, "#5b5347", 0.12],
    [1, "#5b5347", 0.5],
  ]) +
  radial("dome", [
    [0, "#FFFAF0"],
    [0.55, "#EEE3CC"],
    [1, "#D5C6A9"],
  ], 'cx="0.36" cy="0.3" r="0.85"') +
  radial("floor", [
    [0, "#000", 0.3],
    [0.55, "#000", 0.12],
    [1, "#000", 0],
  ]) +
  radial("contact", [
    [0, "#000", 0.55],
    [0.75, "#000", 0.35],
    [1, "#000", 0],
  ]);

interface StickOptions {
  variant?: "closed" | "open";
  geometry?: StickGeometry;
  /** Cool edge light, for deep backgrounds. */
  rimLight?: boolean;
  /** Tint towards deep: a stick further back. */
  dim?: boolean;
  shadow?: boolean;
}

/**
 * One stick in local coordinates (base centre at 0,0), as SVG markup. A
 * simplified StickArt: tube, ring, engraved vane, cylindrical shading, cap or
 * open top with the solid cologne. No grip lines or wax glow.
 */
function stickMarkup(id: string, ringColor: string, options: StickOptions = {}): string {
  const { variant = "closed", geometry: g = FULL_STICK, rimLight = false, dim = false, shadow = true } = options;
  const r = g.width / 2;
  const ry = g.ry;
  const open = variant === "open";
  const sideTop = open ? g.seam : g.top;
  const side = band(sideTop, 0, r, ry);
  const ring = band(g.ringTop, g.ringBottom, r, ry);

  const s = g.engraveSize / VANE_GRID;
  const iconAt = (dy: number) =>
    `translate(${round(-VANE_CENTER.x * s)} ${round(g.engraveY - VANE_CENTER.y * s + dy)}) scale(${round(s * 1000) / 1000})`;
  const lip = round(g.engraveSize / 40);

  const holeR = r - g.width * 0.045;
  const holeRy = (ry * holeR) / r;
  const waxR = round(holeR - g.width * 0.012);
  const waxRy = round((ry * waxR) / r);
  const waxTop = g.seam - g.wax;

  const clip = `${id}-clip`;
  const engrave = `${id}-eng`;

  let out =
    `<defs><clipPath id="${clip}"><path d="${side}"/><ellipse cx="0" cy="${sideTop}" rx="${r}" ry="${ry}"/></clipPath>` +
    `<clipPath id="${engrave}"><path d="${VANE_PATH}" transform="${iconAt(0)}"/></clipPath></defs>`;

  if (shadow) {
    out +=
      `<ellipse cx="${round(r * 0.12)}" cy="${round(ry * 0.6)}" rx="${round(r * 1.6)}" ry="${round(ry * 2)}" fill="url(#floor)"/>` +
      `<ellipse cx="0" cy="${round(ry * 0.35)}" rx="${round(r * 1.06)}" ry="${round(ry * 1.15)}" fill="url(#contact)"/>`;
  }

  out +=
    `<path d="${side}" fill="${ALU}"/>` +
    `<path d="${ring}" fill="${ringColor}"/>` +
    `<g clip-path="url(#${engrave})">` +
    `<path d="${VANE_PATH}" transform="${iconAt(0)}" fill="#000" fill-opacity="0.55"/>` +
    `<path d="${VANE_PATH}" transform="${iconAt(lip)}" fill="${ENGRAVING}"/></g>` +
    `<path d="${side}" fill="url(#shade)"/>` +
    `<path d="${side}" fill="url(#ao)"/>` +
    `<path d="${ring}" fill="url(#sheen)"/>` +
    `<g clip-path="url(#${clip})"><path d="${frontArc(g.ringTop, r, ry)}${frontArc(g.ringBottom, r, ry)}" stroke="#000" stroke-opacity="0.52" stroke-width="0.7" fill="none"/></g>`;

  if (open) {
    const waxBand = band(waxTop, g.seam, waxR, waxRy);
    out +=
      `<ellipse cx="0" cy="${g.seam}" rx="${r}" ry="${ry}" fill="url(#wall)"/>` +
      `<ellipse cx="0" cy="${g.seam}" rx="${round(holeR)}" ry="${round(holeRy)}" fill="#060708"/>` +
      `<path d="${waxBand}" fill="${WAX}"/>` +
      `<path d="${waxBand}" fill="url(#wax)"/>` +
      `<path d="M${-waxR} ${waxTop}A${waxR} ${g.dome} 0 0 1 ${waxR} ${waxTop}A${waxR} ${waxRy} 0 0 1 ${-waxR} ${waxTop}Z" fill="url(#dome)"/>` +
      `<path d="${frontArc(waxTop, waxR, waxRy)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.6" fill="none"/>`;
  } else {
    out +=
      `<ellipse cx="0" cy="${g.top}" rx="${r}" ry="${ry}" fill="url(#cap)"/>` +
      `<g clip-path="url(#${clip})">` +
      `<path d="${frontArc(g.top, r, ry)}" stroke="#fff" stroke-opacity="0.16" stroke-width="0.7" fill="none"/>` +
      `<path d="${frontArc(g.seam, r, ry)}" stroke="#050607" stroke-opacity="0.95" stroke-width="0.9" fill="none"/></g>`;
  }

  if (dim) {
    out += `<rect x="${-r}" y="${sideTop - ry}" width="${g.width}" height="${-sideTop + 2 * ry}" clip-path="url(#${clip})" fill="${C.deep}" fill-opacity="0.15"/>`;
  }

  if (rimLight) {
    out += `<path d="${side}" fill="url(#rim)"/>`;
    if (!open) {
      out += `<path d="${backArc(sideTop, r, ry)}" stroke="#D3E4EC" stroke-opacity="0.3" stroke-width="0.6" fill="none"/>`;
    }
  }

  return `<g>${out}</g>`;
}

/** One standing 15 g stick on a light background (viewBox 1 : 3, like StickRender). */
function stickUri(ringColor: string): string {
  return svgUri(STICK_VIEWBOX, `<defs>${STICK_DEFS}</defs>${stickMarkup("s", ringColor)}`);
}

/** The hero trio (components/media/GroupRender): two closed sticks behind an open one, with a soft light. 4 : 5. */
function groupUri(ringColors: readonly string[]): string {
  const layout = [
    { slot: 0, x: -49, y: -16, scale: 0.86, variant: "closed", back: true },
    { slot: 2, x: 51, y: -24, scale: 0.82, variant: "closed", back: true },
    { slot: 1, x: 2, y: 4, scale: 1, variant: "open", back: false },
  ] as const;
  const defs =
    STICK_DEFS +
    radial("glow", [
      [0, C.fog, 0.09],
      [0.6, C.fog, 0.035],
      [1, C.fog, 0],
    ]) +
    radial("pool", [
      [0, C.fog, 0.07],
      [1, C.fog, 0],
    ]);
  const sticks = layout
    .map(({ slot, x, y, scale, variant, back }) => {
      const color = ringColors[slot];
      if (!color) return "";
      return `<g transform="translate(${x} ${y}) scale(${scale})">${stickMarkup(`g${slot}`, color, { variant, rimLight: true, dim: back })}</g>`;
    })
    .join("");
  return svgUri(
    "-130 -305 260 325",
    `<defs>${defs}</defs><ellipse cx="0" cy="-140" rx="128" ry="160" fill="url(#glow)"/><ellipse cx="0" cy="2" rx="125" ry="16" fill="url(#pool)"/>${sticks}`,
  );
}

/** Discovery Set: the six 3 g mini sticks standing in a row, in catalogue order. viewBox 300 x 180. */
function discoveryUri(ringColors: readonly string[]): string {
  const xs = [-110, -66, -22, 22, 66, 110];
  const sticks = ringColors
    .slice(0, 6)
    .map((color, i) => `<g transform="translate(${xs[i]} 0)">${stickMarkup(`d${i}`, color, { geometry: MINI_STICK })}</g>`)
    .join("");
  return svgUri("-150 -165 300 180", `<defs>${STICK_DEFS}</defs>${sticks}`);
}

/** Travel Pouch (components/media/PouchRender, simplified): sand canvas, kelp binding, three caps showing. viewBox 400 x 500. */
function pouchUri(): string {
  const front = "M66 206Q200 211 334 206Q340 320 337 418Q336 444 310 446Q200 452 90 446Q64 444 63 418Q60 320 66 206Z";
  const binding = "M66 206Q200 211 334 206L334.4 232Q200 237 65.6 232Z";
  const back = "M70 200Q200 194 330 200L334 206Q200 211 66 206Z";
  const sticks = [
    { x: 146, y: 404, lean: -4 },
    { x: 254, y: 400, lean: 4 },
    { x: 200, y: 392, lean: 0 },
  ]
    .map(
      ({ x, y, lean }, i) =>
        `<g transform="translate(${x} ${y}) rotate(${lean}) scale(0.78)">${stickMarkup(`p${i}`, ALU, { shadow: false })}</g>`,
    )
    .join("");
  const defs =
    STICK_DEFS +
    linear("canvas", [0, 0, 1, 0], [
      [0, "#D3C7B1"],
      [0.12, "#E3D9C6"],
      [0.38, "#ECE4D5"],
      [0.7, "#E4DAC8"],
      [0.92, "#D8CCB6"],
      [1, "#C9BCA4"],
    ]) +
    linear("depth", [0, 0, 0, 1], [
      [0, "#000", 0.1],
      [0.14, "#000", 0],
      [0.75, "#000", 0],
      [1, "#000", 0.14],
    ]) +
    linear("binding", [0, 0, 1, 0], [
      [0, "#223830"],
      [0.35, "#38594C"],
      [0.75, C.kelp],
      [1, "#21362D"],
    ]) +
    radial("pouchFloor", [
      [0, "#000", 0.28],
      [0.6, "#000", 0.1],
      [1, "#000", 0],
    ]) +
    `<clipPath id="front"><path d="${front}"/></clipPath>`;
  const tab = `<g transform="translate(336 262)"><path d="M-4 0H20Q24 0 24 4V42Q24 46 20 46H-4Z" fill="${C.kelp}"/><path d="${VANE_PATH}" fill="${C.sand}" transform="translate(${round(13.5 - VANE_CENTER.x * 0.52)} ${round(23 - VANE_CENTER.y * 0.52)}) scale(0.52)"/></g>`;
  const body =
    `<g transform="translate(200 262) scale(1.08) translate(-200 -305)">` +
    `<ellipse cx="200" cy="447" rx="172" ry="18" fill="url(#pouchFloor)"/>` +
    `<path d="${back}" fill="#1E3229"/>${sticks}` +
    `<path d="${front}" fill="url(#canvas)"/>` +
    `<g clip-path="url(#front)"><rect x="56" y="200" width="290" height="260" fill="url(#depth)"/><path d="${binding}" fill="url(#binding)"/></g>` +
    `<g fill="none" stroke-linecap="round" stroke-dasharray="4.5 3.2" stroke-width="1.1">` +
    `<path d="M72 213.5Q200 218.5 328 213.5" stroke="#E9E1D2" stroke-opacity="0.7"/>` +
    `<path d="M72 226Q200 231 328 226" stroke="#E9E1D2" stroke-opacity="0.7"/>` +
    `<path d="M75 246Q72 330 74.5 414Q75.5 434 94 435.5Q200 441 306 435.5Q324.5 434 325.5 414Q328 330 325 246" stroke="#8f826b" stroke-opacity="0.65"/></g>` +
    `<path d="${front}" fill="none" stroke="#000" stroke-opacity="0.1" stroke-width="1"/>${tab}</g>`;
  return svgUri("0 0 400 500", `<defs>${defs}</defs>${body}`);
}

/** E-gift card (components/media/GiftCardRender, without the printed text): deep card, vane, wordmark. viewBox 380 x 260. */
function giftCardUri(): string {
  const wmScale = 132 / WORDMARK_WIDTH;
  const defs =
    linear("card", [0, 0, 1, 1], [
      [0, "#1B4256"],
      [0.55, C.deep],
      [1, "#0A1C25"],
    ]) +
    linear("cardSheen", [0, 0, 1, 0.6], [
      [0, "#fff", 0.07],
      [0.45, "#fff", 0],
    ]) +
    `<filter id="blur" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="9"/></filter>` +
    `<clipPath id="cardClip"><rect x="-160" y="-100" width="320" height="200" rx="14"/></clipPath>`;
  const body =
    `<g transform="translate(190 126) rotate(-5)">` +
    `<rect x="-150" y="-88" width="300" height="190" rx="14" fill="#000" opacity="0.3" filter="url(#blur)" transform="translate(4 12)"/>` +
    `<rect x="-160" y="-100" width="320" height="200" rx="14" fill="url(#card)"/>` +
    `<g clip-path="url(#cardClip)"><path d="${VANE_PATH}" fill="${C.fog}" opacity="0.03" transform="translate(-40 -112) scale(7.5)"/>` +
    `<rect x="-160" y="-100" width="320" height="200" fill="url(#cardSheen)"/></g>` +
    `<rect x="-151" y="-91" width="302" height="182" rx="9" fill="none" stroke="${C.fog}" stroke-opacity="0.14" stroke-width="0.8"/>` +
    `<path d="${VANE_PATH}" fill="${C.fog}" transform="translate(${round(-136 - 2.5 * 1.1)} ${round(-62 - VANE_CENTER.y * 1.1)}) scale(1.1)"/>` +
    `<path d="${WORDMARK_PATH}" fill="${C.fog}" transform="translate(-136 62) scale(${round(wmScale * 10000) / 10000})"/></g>`;
  return svgUri("0 0 380 260", `<defs>${defs}</defs>${body}`);
}

function wordmarkUri(color: string): string {
  return svgUri(WORDMARK_VIEWBOX, `<path fill="${color}" d="${WORDMARK_PATH}"/>`);
}

/** Wordmark at a given height (its width follows the ink box). */
function wordmark(color: string, height: number): ReactElement {
  const width = Math.round((WORDMARK_WIDTH / WORDMARK_HEIGHT) * height);
  // eslint-disable-next-line @next/next/no-img-element -- Satori renders <img>, not next/image.
  return <img src={wordmarkUri(color)} width={width} height={height} alt="" />;
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

/** Spec labels from content/site.ts (the only product facts copy may state, brief §2.6). */
function specLine(ids: readonly string[]): string {
  return ids
    .map((id) => site.specs.find((spec) => spec.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .join(" · ");
}

/* ------------------------------------------------------------------ */
/* Brand image                                                         */
/* ------------------------------------------------------------------ */

/** app/opengraph-image.tsx: wordmark, tagline and the hero trio on deep. */
export async function brandImageResponse(products: readonly Product[]): Promise<ImageResponse> {
  const sticks = products.filter(isStick);
  const trio = home.hero.groupScents
    .map((slug) => sticks.find((stick) => stick.slug === slug)?.ringColor)
    .filter((color): color is string => Boolean(color));

  return respond(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: C.deep,
        backgroundImage: "radial-gradient(circle at 78% 46%, #16384A 0%, #0F2733 58%)",
        color: C.fog,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 720,
          padding: "76px 0 70px 84px",
        }}
      >
        {wordmark(C.fog, 34)}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: 104,
              lineHeight: 1.02,
              letterSpacing: -1.5,
              maxWidth: 600,
            }}
          >
            {site.tagline}
          </div>
          <div style={{ marginTop: 30, fontSize: 32, lineHeight: 1.3, color: C.mist }}>{home.hero.heading}</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: C.mist }}>
          {specLine(["weight", "alcohol-free", "twist-up", "wax-base"])}
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "center", paddingBottom: 34 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders <img>, not next/image. */}
        <img src={groupUri(trio)} width={432} height={540} alt="" />
      </div>
    </div>,
  );
}

/* ------------------------------------------------------------------ */
/* Product image                                                       */
/* ------------------------------------------------------------------ */

interface ProductArt {
  src: string;
  width: number;
  height: number;
  /** Colours of the accent bar along the bottom edge. */
  accent: string[];
  /** Soft disc behind the drawing (sticks: the ring colour). */
  halo: string | null;
}

function productArt(product: Product, sticks: readonly StickProduct[]): ProductArt {
  switch (product.kind) {
    case "stick":
      return { src: stickUri(product.ringColor), width: 164, height: 492, accent: [product.ringColor], halo: product.ringColor };
    case "discovery-set": {
      const colors = sticks.map((stick) => stick.ringColor);
      return { src: discoveryUri(colors), width: 400, height: 240, accent: colors, halo: null };
    }
    case "pouch":
      return { src: pouchUri(), width: 368, height: 460, accent: [C.kelp], halo: null };
    case "gift-card":
      return { src: giftCardUri(), width: 400, height: 274, accent: [C.deep], halo: null };
  }
}

/**
 * Eyebrow, the line under the name (as parts that wrap only between each
 * other: a stick's notes per group, "Smoked vetiver, amber" never splits) and
 * the spec line at the bottom, per product kind.
 */
function productCopy(product: Product): { eyebrow: string | null; line: string[]; specs: string | null } {
  switch (product.kind) {
    case "stick":
      return {
        eyebrow: `${product.family} · ${home.hero.eyebrow}`,
        line: formatNotes(product.notes).split(" · "),
        specs: specLine(["weight", "alcohol-free", "twist-up", "wax-base"]),
      };
    case "discovery-set":
      return { eyebrow: home.hero.eyebrow, line: [product.tagline], specs: specLine(["alcohol-free", "wax-base"]) };
    case "pouch":
    case "gift-card":
      return { eyebrow: null, line: [product.tagline], specs: null };
  }
}

/** app/products/[slug]/opengraph-image.tsx: name, family and notes on fog; the drawing on a sand panel. */
export async function productImageResponse(product: Product, sticks: readonly StickProduct[]): Promise<ImageResponse> {
  const art = productArt(product, sticks);
  const copy = productCopy(product);
  const long = product.name.length > 12;

  return respond(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.fog,
        color: C.ink,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 740,
          padding: "70px 56px 74px 84px",
        }}
      >
        {wordmark(C.ink, 28)}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {copy.eyebrow ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              {isStick(product) ? (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    marginRight: 14,
                    borderRadius: 9,
                    backgroundColor: product.ringColor,
                    border: `1.5px solid ${C.inkSoft}`,
                  }}
                />
              ) : null}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: 3.2,
                  textTransform: "uppercase",
                  color: C.inkSoft,
                }}
              >
                {copy.eyebrow}
              </div>
            </div>
          ) : null}
          <div
            style={{
              marginTop: copy.eyebrow ? 22 : 0,
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: long ? 84 : 96,
              lineHeight: 1.04,
              letterSpacing: -1.2,
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: 26,
              fontSize: 30,
              lineHeight: 1.35,
              color: C.inkSoft,
              maxWidth: 580,
            }}
          >
            {copy.line.map((part, index) => (
              <div key={part} style={{ display: "flex", whiteSpace: "pre" }}>
                {index < copy.line.length - 1 ? `${part} · ` : part}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: C.inkSoft, minHeight: 28 }}>{copy.specs ?? site.tagline}</div>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.sand,
        }}
      >
        {art.halo ? (
          <div
            style={{
              position: "absolute",
              left: 50,
              top: 125,
              width: 360,
              height: 360,
              borderRadius: 180,
              backgroundImage: `radial-gradient(circle, ${art.halo}55 0%, ${art.halo}22 45%, ${art.halo}00 70%)`,
            }}
          />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders <img>, not next/image. */}
        <img src={art.src} width={art.width} height={art.height} alt="" />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, display: "flex" }}>
        {art.accent.map((color) => (
          <div key={color} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </div>
    </div>,
  );
}
