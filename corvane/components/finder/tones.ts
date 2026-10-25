import type { ButtonVariant } from "@/components/ui/Button";

/**
 * Surfaces the scent finder can sit on. "deep" is the default (a dark moment
 * between the sand comparison and the fog sections below it); "sand" is the
 * light alternative. Contrast follows docs/PLAN.md §3: fog and mist on deep,
 * ink and ink-soft on the fog panel inside sand. Signal stays for Add to cart.
 */
export type FinderTone = "deep" | "sand";

export interface FinderToneClasses {
  section: string;
  /** Faint light behind the panel (deep only). */
  glow: string | null;
  panel: string;
  strong: string;
  soft: string;
  rule: string;
  /** Option tile; the selected look comes from :has(:checked), so it also holds before hydration. */
  tile: string;
  /** Radio mark inside a tile (the label is the `group`). */
  mark: string;
  progressOn: string;
  progressOff: string;
  /** Backdrop of the stick on the result step. */
  specimen: string;
  /** Alpha (hex) of the ring-colour glow behind the stick. */
  glowAlpha: string;
  next: ButtonVariant;
  ghost: ButtonVariant;
  heading: "light" | "dark";
  rimLight: boolean;
  /** Text links and the ring of the family dot. */
  link: string;
  dot: string;
}

const tileBase =
  "group relative flex min-h-16 cursor-pointer items-center gap-3.5 rounded-card border px-4 py-3 text-left " +
  "text-[0.9375rem] leading-snug font-medium transition-[background-color,border-color,color] duration-200 ease-out " +
  "sm:min-h-[4.75rem] sm:px-5 lg:min-h-[5.25rem] has-focus-visible:outline-2 has-focus-visible:outline-offset-2";

const markBase =
  "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200 " +
  "forced-colors:border-current";

export const finderTones: Record<FinderTone, FinderToneClasses> = {
  deep: {
    section: "focus-on-dark bg-deep text-fog",
    glow:
      "bg-[radial-gradient(70%_55%_at_50%_75%,rgb(30_72_94/0.42),transparent_72%)] " +
      "lg:bg-[radial-gradient(50%_70%_at_72%_50%,rgb(30_72_94/0.45),transparent_72%)]",
    panel: "border border-line-on-deep bg-fog/[0.035]",
    strong: "text-fog",
    soft: "text-mist",
    rule: "border-line-on-deep",
    tile: `${tileBase} border-line-on-deep bg-fog/[0.03] text-fog hover:border-fog/45 hover:bg-fog/[0.06] has-checked:border-fog has-checked:bg-fog has-checked:text-ink has-focus-visible:outline-fog`,
    // 55% fog on deep is about 5 : 1 (WCAG 1.4.11); checked: ink on the fog tile.
    mark: `${markBase} border-fog/55 text-fog group-hover:border-fog/80 group-has-checked:border-ink group-has-checked:bg-ink`,
    progressOn: "bg-fog",
    progressOff: "bg-fog/20",
    specimen: "bg-[linear-gradient(180deg,rgb(16_20_24/0.05),rgb(16_20_24/0.32))] ring-1 ring-inset ring-line-on-deep",
    glowAlpha: "4d",
    next: "on-dark",
    ghost: "ghost-on-dark",
    heading: "dark",
    rimLight: true,
    link: "text-fog decoration-fog/40 hover:decoration-fog",
    dot: "ring-fog/50",
  },
  sand: {
    section: "bg-sand text-ink",
    glow: null,
    panel: "border border-ink/[0.07] bg-fog shadow-soft",
    strong: "text-ink",
    soft: "text-ink-soft",
    rule: "border-line",
    tile: `${tileBase} border-line bg-white/55 text-ink hover:border-ink/40 has-checked:border-ink has-checked:bg-white has-checked:after:pointer-events-none has-checked:after:absolute has-checked:after:-inset-px has-checked:after:rounded-card has-checked:after:border-2 has-checked:after:border-ink has-focus-visible:outline-ink`,
    // 55% ink on the white tile is about 4 : 1 (WCAG 1.4.11).
    mark: `${markBase} border-ink/55 text-fog group-hover:border-ink/80 group-has-checked:border-ink group-has-checked:bg-ink`,
    progressOn: "bg-ink",
    progressOff: "bg-ink/15",
    specimen: "bg-sand/70",
    glowAlpha: "40",
    next: "secondary",
    ghost: "ghost",
    heading: "light",
    rimLight: false,
    link: "text-ink decoration-ink/35 hover:decoration-ink",
    dot: "ring-ink-soft/60",
  },
};
