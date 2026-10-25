import { cn } from "@/lib/cn";

import { FULL_STICK, StickArt, useSvgId } from "./StickRender";

/**
 * Hero composition: three sticks, left to right as passed. The middle one
 * stands in front with the cap off; the outer two are closed, slightly behind
 * it at staggered heights (docs/PLAN.md §14: North Swell, Drift & Ember and
 * Lantern Smoke, content/home.ts heroScents).
 *
 * Made for the deep (#0F2733) hero. Matte black on deep is only about 1.2 : 1,
 * so every tube gets a cool rim light along its silhouette, and a faint pool
 * of light sits behind the group. It also reads on fog and sand.
 *
 * Aspect 4 : 5 (viewBox 260 x 325), the same as the hero.group photo slot.
 */

export interface GroupScent {
  ringColor: string;
  name: string;
}

export interface GroupRenderProps {
  /** Three scents, left to right; the middle one is shown open. Extra entries are ignored. */
  scents: readonly GroupScent[];
  /** Sizing, e.g. "h-full w-auto"; replaces the default "h-auto w-full". */
  className?: string;
}

/** Placement of each stick: x, base y, scale, variant. Back sticks first, so the front one overlaps. */
const LAYOUT = [
  { slot: 0, x: -57, y: -16, scale: 0.86, variant: "closed" },
  { slot: 2, x: 59, y: -24, scale: 0.82, variant: "closed" },
  { slot: 1, x: 2, y: 4, scale: 1, variant: "open" },
] as const;

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function GroupRender({ scents, className }: GroupRenderProps) {
  const id = useSvgId("group");
  const trio = scents.slice(0, 3);
  const label = `${joinNames(trio.map((scent) => scent.name))} solid cologne sticks`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-130 -305 260 325"
      className={cn("block", className ?? "h-auto w-full")}
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F7F5F1" stopOpacity="0.09" />
          <stop offset="0.6" stopColor="#F7F5F1" stopOpacity="0.035" />
          <stop offset="1" stopColor="#F7F5F1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-pool`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F7F5F1" stopOpacity="0.07" />
          <stop offset="1" stopColor="#F7F5F1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft light behind the group and on the floor */}
      <ellipse cx="0" cy="-140" rx="128" ry="160" fill={`url(#${id}-glow)`} />
      <ellipse cx="0" cy="2" rx="125" ry="16" fill={`url(#${id}-pool)`} />

      {LAYOUT.map(({ slot, x, y, scale, variant }) => {
        const scent = trio[slot];
        if (!scent) return null;
        return (
          <g key={slot} transform={`translate(${x} ${y}) scale(${scale})`}>
            <StickArt
              id={`${id}-s${slot}`}
              ringColor={scent.ringColor}
              variant={variant}
              geometry={FULL_STICK}
              rimLight
            />
          </g>
        );
      })}
    </svg>
  );
}
