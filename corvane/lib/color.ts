/**
 * Colour helpers for marks drawn on a product colour (a check on a scent's
 * ring-colour swatch). Pure functions, no DOM.
 */

/** ink and fog from the design tokens (docs/PLAN.md §3). */
const INK = "#101418";
const FOG = "#F7F5F1";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #RRGGBB colour; null for anything else. */
export function relativeLuminance(hex: string): number | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  const r = channel((value >> 16) & 0xff);
  const g = channel((value >> 8) & 0xff);
  const b = channel(value & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #RRGGBB colours (1 to 21); 1 when either is not a hex colour. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** "ink" or "fog", whichever contrasts more with `background` (ink when unknown). */
export function markToneOn(background: string): "ink" | "fog" {
  return contrastRatio(background, FOG) > contrastRatio(background, INK) ? "fog" : "ink";
}
