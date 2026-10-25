import { VaneIcon } from "@/components/brand/VaneIcon";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import type { StickProduct } from "@/lib/types";

/**
 * Notes card for the product gallery: top, heart and base notes, with the ring
 * colour as the accent (decoration only, never as text colour). It fills its
 * container (for example a 4:5 gallery slide) and scales its type with the
 * container width, so it also works as a small thumbnail.
 */

export interface NotesCardProps {
  product: StickProduct;
  className?: string;
}

const TIERS = ["top", "heart", "base"] as const;

function capitalise(note: string): string {
  return note.charAt(0).toUpperCase() + note.slice(1);
}

export function NotesCard({ product, className }: NotesCardProps) {
  const ring = product.ringColor;

  return (
    <div
      className={cn("@container relative h-full w-full overflow-hidden text-ink", className)}
      style={{ backgroundImage: "radial-gradient(120% 90% at 30% 15%, #F5F0E7 0%, #EEE6D8 50%, #E5DBCA 100%)" }}
    >
      <div className="flex h-full flex-col p-[8cqw]">
        {/* Labels drop out in thumbnail-sized containers, where they could not be read anyway. */}
        <div className="flex items-center justify-between gap-4 @max-[9rem]:hidden">
          <p className="label-caps text-[length:clamp(9px,2.4cqw,12px)] text-ink-soft">{pdp.notes.label}</p>
          <p className="label-caps text-[length:clamp(9px,2.4cqw,12px)] text-ink-soft">{pdp.family(product.family)}</p>
        </div>

        <p className="mt-[7cqw] font-serif text-[length:clamp(8px,9cqw,52px)] leading-[1.05] tracking-[-0.015em] @max-[9rem]:mt-0">
          {product.name}
        </p>
        <span
          aria-hidden="true"
          className="mt-[4cqw] block h-[1.6cqw] w-[16cqw] rounded-full ring-1 ring-ink-soft/40"
          style={{ backgroundColor: ring }}
        />

        <dl className="relative mt-auto">
          {/* A thin line in the ring colour links the three tiers, top to base. */}
          <span
            aria-hidden="true"
            className="absolute bottom-[7cqw] left-[1.1cqw] top-[7cqw] w-px"
            style={{ backgroundColor: ring }}
          />
          {TIERS.map((tier) => (
            <div key={tier} className="relative border-t border-line py-[4cqw] pl-[7cqw]">
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 size-[2.4cqw] -translate-y-1/2 rounded-full ring-1 ring-ink-soft/40"
                style={{ backgroundColor: ring }}
              />
              <dt className="label-caps text-[length:clamp(9px,2.2cqw,12px)] text-ink-soft @max-[9rem]:hidden">
                {pdp.notes[tier]}
              </dt>
              <dd className="mt-[1.2cqw] font-serif text-[length:clamp(6px,5.4cqw,30px)] leading-tight">
                {product.notes[tier].map(capitalise).join(", ")}
              </dd>
            </div>
          ))}
        </dl>

        <VaneIcon className="absolute right-[8cqw] top-[18cqw] size-[9cqw] text-ink opacity-[0.07]" />
      </div>
    </div>
  );
}
