import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

/**
 * Solid vs spray (brief §6.8, docs/PLAN.md §4.7): a fair comparison of solid
 * cologne with spray in general. Exactly the four rows of home.comparison
 * (Format, Alcohol, Glass, Leak risk), no brand names, no performance numbers.
 *
 * Two real tables with the same data, one per breakpoint (the other is
 * display: none, so screen readers only meet one):
 * - Mobile: two narrow value columns. Each feature is a row group with its
 *   label as a header across both columns, so nothing scrolls sideways. The
 *   column headers stick under the site header while the table is in view.
 * - md+: the classic three columns, feature | solid | spray.
 * The solid column sits on a fog panel so it is easy to follow; both columns
 * use the same text colour, because neither side is played down.
 */

export interface SolidVsSprayProps {
  className?: string;
}

export function SolidVsSpray({ className }: SolidVsSprayProps) {
  const { id, label, heading, intro, caption, columns, rows, note } = home.comparison;
  const headingId = `${id}-heading`;
  const lastIndex = rows.length - 1;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-sand text-ink", className)}>
      <Container className="py-20 md:py-28 lg:py-32">
        <SectionHeading id={headingId} eyebrow={label} title={heading} intro={intro} />

        {/* Mobile: two value columns, a header row per feature */}
        <table className="mt-12 -mx-1.5 w-[calc(100%+0.75rem)] table-fixed border-separate border-spacing-x-1.5 border-spacing-y-0 md:hidden">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-header z-10 bg-sand pb-3 text-left align-bottom font-serif text-lg leading-tight"
              >
                {columns.solid}
              </th>
              <th
                scope="col"
                className="sticky top-header z-10 bg-sand pb-3 text-left align-bottom font-serif text-lg leading-tight"
              >
                {columns.spray}
              </th>
            </tr>
          </thead>
          {rows.map((row) => (
            <tbody key={row.id}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={2}
                  className="label-caps border-t border-line pt-5 pb-3 text-left text-ink-soft"
                >
                  {row.label}
                </th>
              </tr>
              <tr>
                <td className="rounded-xl bg-fog px-3.5 py-3.5 align-top text-[0.9375rem] leading-[1.55]">{row.solid}</td>
                <td className="rounded-xl border border-line px-3.5 py-3.5 align-top text-[0.9375rem] leading-[1.55]">
                  {row.spray}
                </td>
              </tr>
              {/* Space under each group, kept inside the table so the sticky headers stay put */}
              <tr aria-hidden="true">
                <td colSpan={2} className="h-5 p-0" />
              </tr>
            </tbody>
          ))}
        </table>

        {/* md+: feature | solid | spray */}
        <table className="mt-16 hidden w-full table-fixed border-separate border-spacing-0 md:table lg:mt-20">
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[39%]" />
            <col className="w-[39%]" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="label-caps pr-6 pb-6 text-left align-bottom text-ink-soft">
                {columns.feature}
              </th>
              <th
                scope="col"
                className="rounded-t-card bg-fog px-8 pt-8 pb-6 text-left align-bottom font-serif text-2xl leading-tight lg:px-10"
              >
                {columns.solid}
              </th>
              <th scope="col" className="px-8 pb-6 text-left align-bottom font-serif text-2xl leading-tight lg:px-10">
                {columns.spray}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="label-caps border-t border-line py-7 pr-6 text-left align-top leading-6 text-ink"
                >
                  {row.label}
                </th>
                <td
                  className={cn(
                    "border-t border-line bg-fog px-8 py-7 align-top text-base leading-relaxed lg:px-10",
                    index === lastIndex && "rounded-b-card pb-9",
                  )}
                >
                  {row.solid}
                </td>
                <td className="border-t border-line px-8 py-7 align-top text-base leading-relaxed lg:px-10">
                  {row.spray}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-8 max-w-[36rem] text-sm leading-relaxed text-ink-soft md:mt-10">{note}</p>
      </Container>
    </section>
  );
}
