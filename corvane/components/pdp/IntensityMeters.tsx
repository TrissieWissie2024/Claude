import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import type { Scale, StickProduct } from "@/lib/types";

/**
 * Two indicative scales for a scent (docs/PLAN.md §9, D22): fresh to warm and
 * projection (soft to strong), five steps each, from product.intensity. They
 * compare the scents within the range and are not a measurement, so the block
 * carries the "Indicative" label and the explanation from content/pdp.ts.
 *
 * The bars are decoration (aria-hidden); each scale has one text for screen
 * readers, e.g. "Fresh to warm: 2 of 5". Server-compatible.
 */

export interface IntensityMetersProps {
  intensity: StickProduct["intensity"];
  /** Level of the "Character" heading. Default 2 (under the product h1). */
  headingLevel?: 2 | 3;
  className?: string;
}

const STEPS = [1, 2, 3, 4, 5] as const;
const MAX = STEPS.length;

interface MeterCopy {
  label: string;
  start: string;
  end: string;
}

export function IntensityMeters({ intensity, headingLevel = 2, className }: IntensityMetersProps) {
  const Heading = `h${headingLevel}` as const;
  const meters: { id: string; copy: MeterCopy; value: Scale }[] = [
    { id: "fresh-warm", copy: pdp.intensity.freshWarm, value: intensity.freshWarm },
    { id: "projection", copy: pdp.intensity.projection, value: intensity.projection },
  ];

  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <Heading className="label-caps text-ink-soft">{pdp.sections.character}</Heading>
        <span className="label-caps inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] leading-none tracking-[0.12em] text-ink-soft ring-1 ring-ink/20 ring-inset">
          {pdp.intensity.label}
        </span>
      </div>

      <ul role="list" className="mt-4 grid grid-cols-2 gap-x-6 sm:gap-x-8">
        {meters.map((meter) => (
          <li key={meter.id}>
            <p className="text-sm font-medium text-ink">
              <span aria-hidden="true">{meter.copy.label}</span>
              <span className="sr-only">
                {meter.copy.label}: {pdp.intensity.valueText(meter.value, MAX)}
              </span>
            </p>
            <div aria-hidden="true" className="mt-2.5 flex gap-1">
              {STEPS.map((step) => (
                <span
                  key={step}
                  className={cn(
                    // Forced colors would drop the backgrounds: system colours keep the steps visible there.
                    "h-1.5 flex-1 rounded-full forced-color-adjust-none",
                    step <= meter.value ? "bg-ink forced-colors:bg-[CanvasText]" : "bg-ink/12 forced-colors:bg-[GrayText]",
                  )}
                />
              ))}
            </div>
            <div aria-hidden="true" className="mt-1.5 flex justify-between text-xs text-ink-soft">
              <span>{meter.copy.start}</span>
              <span>{meter.copy.end}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-[34rem] text-[0.8125rem] leading-relaxed text-ink-soft">{pdp.intensity.explanation}</p>
    </div>
  );
}
