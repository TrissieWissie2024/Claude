import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/components/home/icons";
import { renderInline } from "@/components/legal/InlineText";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { UpcomingHolidays } from "@/components/legal/UpcomingHolidays";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Flag } from "@/components/ui/Flag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pages } from "@/content/pages";
import { cn } from "@/lib/cn";
import { pageMetadata } from "@/lib/seo";

const copy = pages.shippingReturns;

export const metadata: Metadata = pageMetadata({
  title: copy.meta.title,
  description: copy.meta.description,
  path: "/shipping-returns",
});

/**
 * /shipping-returns (brief §6, docs/PLAN.md §1, §13). All copy comes from
 * content/pages.ts; rates, delivery times, cut-off and holidays are derived
 * there from content/shipping.ts and content/offers.ts, so they never drift.
 *
 * - The legal review notice ("TODO: laten controleren") sits at the top,
 *   because the page carries the statutory withdrawal text (brief §6).
 * - The 14-day right of withdrawal is presented as a legal right (how to
 *   withdraw, the model form, refund, return costs, condition), never as a
 *   perk. The 30-day guarantee is its own section, labelled as voluntary and
 *   on top of those rights. Damaged or wrong items: statutory conformity.
 * - Section ids match the table of contents and existing links
 *   (/shipping-returns#withdrawal from the guarantee block and the FAQ).
 * - Copy may contain the inline markup of content/legal.ts (the email
 *   address is a mailto link, as on the legal pages).
 * - The holiday list drops dates that have passed, after mount
 *   (UpcomingHolidays); the static HTML lists them all.
 *
 * Layout: notice, heading, then the contents list (phones: a list under the
 * heading; lg+: a sticky column on the left, 3 columns) and the sections on
 * the right, in a column of 36rem (about 70 characters per line of body
 * text, the same measure as the legal pages), so hairlines, table and cards
 * line up with the text.
 */
export default function ShippingReturnsPage() {
  return (
    <Container className="pt-8 pb-20 md:pt-10 md:pb-28 lg:pt-12 lg:pb-32">
      <LegalNotice text={copy.reviewNotice} />

      <SectionHeading
        level={1}
        eyebrow={copy.eyebrow}
        title={copy.h1}
        intro={copy.intro}
        eyebrowRule="neutral"
        className="mt-10 md:mt-14"
      />

      <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-x-8">
        <nav aria-labelledby="sr-toc-label" className="lg:col-span-3">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <p id="sr-toc-label" className="label-caps text-ink-soft">
              {copy.tocLabel}
            </p>
            <ol className="mt-3 border-t border-line">
              {copy.toc.map((entry, index) => (
                <li key={entry.id} className="border-b border-line">
                  <a
                    href={`#${entry.id}`}
                    className="flex min-h-11 items-center gap-3 py-2.5 text-[0.9375rem] text-ink decoration-ink/40 underline-offset-4 hover:underline"
                  >
                    <span aria-hidden="true" className="tabular w-5 shrink-0 text-[13px] text-ink-soft">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {entry.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="min-w-0 max-w-[36rem] lg:col-span-8 lg:col-start-5">
          <RatesSection />
          <DispatchSection />
          <Section id={copy.delivery.id} heading={copy.delivery.heading}>
            <Paragraphs items={copy.delivery.body} />
          </Section>
          <WithdrawalSection />
          <GuaranteeSection />
          <Section id={copy.damaged.id} heading={copy.damaged.heading} tag={copy.tags.damaged}>
            <Paragraphs items={copy.damaged.body} />
          </Section>
          <ContactBlock />
        </div>
      </div>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

interface SectionProps {
  id: string;
  heading: string;
  /** Small label above the heading, e.g. "Your statutory right". */
  tag?: string;
  children: ReactNode;
}

function Section({ id, heading, tag, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="border-t border-line py-10 first:border-t-0 first:pt-0 md:py-14"
    >
      {tag ? <p className="label-caps mb-3 text-ink-soft">{tag}</p> : null}
      <h2 id={headingId} className="text-[1.625rem] leading-[1.15] md:text-[2.125rem]">
        {heading}
      </h2>
      <div className="mt-5 md:mt-6">{children}</div>
    </section>
  );
}

function SubHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("mt-10 font-sans text-[1.0625rem] font-semibold tracking-normal text-ink md:text-lg", className)}>
      {children}
    </h3>
  );
}

function Paragraphs({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 text-base leading-relaxed text-ink-soft md:text-[1.0625rem]", className)}>
      {items.map((paragraph) => (
        <p key={paragraph}>{renderInline(paragraph)}</p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function RatesSection() {
  const { rates } = copy;
  const { columns } = rates.table;
  const cell = "py-4 pr-3 align-top last:pr-0 md:pr-6";
  const { rows } = rates.table;
  const facts = [
    { label: columns.rate, value: (row: (typeof rows)[number]) => row.rate, numeric: true },
    { label: columns.freeFrom, value: (row: (typeof rows)[number]) => row.freeFrom, numeric: true },
    { label: columns.deliveryTime, value: (row: (typeof rows)[number]) => row.deliveryTime, numeric: false },
  ];

  return (
    <Section id={rates.id} heading={rates.heading}>
      {/*
        Two tables with the same data; one is display:none, so assistive tech gets one.
        Phones: countries as columns (two countries fit side by side, values stay on one or two lines).
        sm+: one row per country.
      */}
      <div className="-mx-5 overflow-x-auto px-5 sm:hidden">
        <table className="w-full border-collapse text-left text-[0.9375rem]">
          <caption className="sr-only">{rates.table.caption}</caption>
          <thead>
            <tr className="border-b border-ink/25">
              <td className="pb-3" />
              {rows.map((row) => (
                <th key={row.code} scope="col" className="pr-3 pb-3 align-bottom font-semibold text-ink last:pr-0">
                  <span className="flex items-center gap-2">
                    <Flag country={row.code} decorative />
                    {row.country}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facts.map((fact) => (
              <tr key={fact.label} className="border-b border-line">
                <th scope="row" className="label-caps w-[7.5rem] py-4 pr-3 align-top text-ink-soft">
                  {fact.label}
                </th>
                {rows.map((row) => (
                  <td key={row.code} className={cn("py-4 pr-3 align-top text-ink last:pr-0", fact.numeric && "tabular")}>
                    {fact.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left text-[0.9375rem] md:text-base">
          <caption className="sr-only">{rates.table.caption}</caption>
          <thead>
            <tr className="border-b border-ink/25">
              {[columns.country, columns.rate, columns.freeFrom, columns.deliveryTime].map((label) => (
                <th key={label} scope="col" className="label-caps pr-3 pb-3 align-bottom text-ink-soft last:pr-0 md:pr-6">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code} className="border-b border-line">
                <th scope="row" className={cn(cell, "font-semibold text-ink")}>
                  <span className="flex items-center gap-2.5">
                    <Flag country={row.code} decorative className="mt-px" />
                    {row.country}
                  </span>
                </th>
                <td className={cn(cell, "tabular text-ink")}>{row.rate}</td>
                <td className={cn(cell, "tabular text-ink")}>{row.freeFrom}</td>
                <td className={cn(cell, "text-ink")}>{row.deliveryTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paragraphs items={rates.body} className="mt-6" />
    </Section>
  );
}

function DispatchSection() {
  const { dispatch } = copy;
  const { holidays } = dispatch;

  return (
    <Section id={dispatch.id} heading={dispatch.heading}>
      <Paragraphs items={dispatch.body} />

      {holidays.years.length > 0 ? (
        <div className="mt-8 rounded-card bg-sand p-5 md:p-7">
          <h3 className="font-sans text-base font-semibold tracking-normal text-ink">{holidays.heading}</h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">{holidays.intro}</p>
          <UpcomingHolidays years={holidays.years} />
        </div>
      ) : null}
    </Section>
  );
}

function WithdrawalSection() {
  const { withdrawal } = copy;
  const { howTo, modelForm, refund, returnCosts, condition } = withdrawal;

  return (
    <Section id={withdrawal.id} heading={withdrawal.heading} tag={copy.tags.withdrawal}>
      <Paragraphs items={withdrawal.body} />

      <SubHeading>{howTo.heading}</SubHeading>
      <ol className="mt-4 flex flex-col gap-4">
        {howTo.steps.map((step, index) => (
          <li key={step} className="flex gap-4 text-base leading-relaxed text-ink-soft md:text-[1.0625rem]">
            <span
              aria-hidden="true"
              className="tabular flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-ink ring-1 ring-ink/25 ring-inset"
            >
              {index + 1}
            </span>
            <span className="min-w-0 pt-0.5">{renderInline(step)}</span>
          </li>
        ))}
      </ol>

      <SubHeading>{modelForm.heading}</SubHeading>
      <div className="mt-4 rounded-card bg-white p-5 ring-1 ring-line ring-inset md:p-7">
        <p className="text-[0.9375rem] leading-relaxed text-ink-soft italic">{modelForm.intro}</p>
        <ul className="mt-5 flex flex-col">
          {modelForm.lines.map((line) => (
            <li
              key={line}
              className={cn(
                "py-3 text-[0.9375rem] leading-relaxed text-ink",
                // Lines that end in a colon are fields to fill in: give them a writing line.
                line.endsWith(":") && "border-b border-dashed border-ink/30 pb-5",
              )}
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-ink-soft">{modelForm.note}</p>
      </div>

      <SubHeading>{refund.heading}</SubHeading>
      <Paragraphs items={refund.body} className="mt-4" />

      <SubHeading>{returnCosts.heading}</SubHeading>
      <Paragraphs items={returnCosts.body} className="mt-4" />

      <SubHeading>{condition.heading}</SubHeading>
      <Paragraphs items={condition.body} className="mt-4" />
    </Section>
  );
}

function GuaranteeSection() {
  const { guarantee } = copy;

  return (
    <Section id={guarantee.id} heading={guarantee.heading} tag={copy.tags.guarantee}>
      <Paragraphs items={guarantee.body} />
      <SubHeading>{guarantee.conditions.heading}</SubHeading>
      <ul className="mt-4 flex flex-col gap-3">
        {guarantee.conditions.items.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-relaxed text-ink-soft md:text-[1.0625rem]">
            <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-ink-soft" />
            <span className="min-w-0">{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ContactBlock() {
  const { contact } = copy;
  return (
    <section
      aria-labelledby="shipping-returns-contact"
      className="mt-4 flex flex-col items-start gap-6 rounded-card bg-sand p-6 md:mt-6 md:flex-row md:items-center md:justify-between md:p-8"
    >
      <div>
        <h2 id="shipping-returns-contact" className="text-[1.625rem] leading-[1.15] md:text-[2rem]">
          {contact.heading}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">{contact.body}</p>
      </div>
      <Button href={contact.link.href} variant="secondary" iconEnd={<ArrowRightIcon className="size-[18px]" />}>
        {contact.link.label}
      </Button>
    </section>
  );
}
