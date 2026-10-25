import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import type { ScentNotes } from "@/lib/types";

/**
 * The notes of a scent as chips, in three rows: top, heart and base
 * (docs/PLAN.md §9). A definition list: the tier is the term, its notes a
 * list of chips. Notes are stored lower case (content/products.ts) and get a
 * capital here. Server-compatible.
 */

export interface NotesChipsProps {
  notes: ScentNotes;
  /** Level of the "Notes" heading. Default 2 (under the product h1). */
  headingLevel?: 2 | 3;
  className?: string;
}

const TIERS = ["top", "heart", "base"] as const;

function capitalise(note: string): string {
  return note.charAt(0).toUpperCase() + note.slice(1);
}

export function NotesChips({ notes, headingLevel = 2, className }: NotesChipsProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={className}>
      <Heading className="label-caps text-ink-soft">{pdp.notes.label}</Heading>
      <dl className="mt-3 flex flex-col gap-2.5">
        {TIERS.map((tier) => (
          <div key={tier} className="flex items-start gap-3">
            <dt className="w-[3.25rem] shrink-0 pt-[0.4375rem] text-[0.8125rem] leading-[1.125rem] text-ink-soft">
              {pdp.notes[tier]}
            </dt>
            <dd className="min-w-0">
              <ul role="list" className="flex flex-wrap gap-1.5">
                {notes[tier].map((note) => (
                  <li
                    key={note}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full bg-white/60 px-3.5 text-sm font-medium text-ink",
                      "ring-1 ring-ink/12 ring-inset",
                    )}
                  >
                    {capitalise(note)}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
