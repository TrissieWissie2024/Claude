import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { LegalNotice } from "@/components/legal/LegalNotice";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  legal,
  legalRoutes,
  legalUi,
  type LegalBlock,
  type LegalFact,
  type LegalPageId,
  type LegalSection,
} from "@/content/legal";
import { cn } from "@/lib/cn";

/** Documents with at least this many sections get a table of contents. */
const MIN_SECTIONS_FOR_CONTENTS = 6;

/**
 * Metadata for a legal page: title (through the root template "%s | CORVANE"),
 * description, canonical URL and robots. Legal pages may be indexed.
 */
export function legalMetadata(id: LegalPageId): Metadata {
  const page = legal[id];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: legalRoutes[id] },
    robots: { index: true, follow: true },
  };
}

export interface LegalPageProps {
  id: LegalPageId;
}

/**
 * A legal document from content/legal.ts (brief §6, docs/PLAN.md §1). A server
 * component; no client JavaScript.
 *
 * Order: the review notice ("TODO: laten controleren") at the very top, the
 * eyebrow, the h1 and intro, the fixed last-updated date, then the table of
 * contents (only for documents with MIN_SECTIONS_FOR_CONTENTS sections or
 * more) and the sections, each an h2 with paragraphs, sub-headings, lists,
 * definition lists and drafting notes. Links to the other legal pages close
 * the page.
 *
 * Layout: the text keeps a readable measure (68ch). Phones and tablets get
 * the contents as a native disclosure (<details>), closed, so the text starts
 * high on the screen and works without JavaScript. From lg the contents are
 * a sticky column on the left (3 of 12 columns) that scrolls on its own when
 * it is taller than the window. Section ids are stable anchors; the sticky
 * header is covered by scroll-padding-top in globals.css.
 *
 * Print: the contents and the related links are hidden, the grid collapses
 * and the text prints in ink. Headings are kept with the text that follows,
 * and definition rows and notes are not split across pages. Hiding the site
 * chrome (promo bar, header, footer) in print needs a rule in globals.css.
 */
export function LegalPage({ id }: LegalPageProps) {
  const page = legal[id];
  const numbered = page.numbered ?? false;
  const showContents = page.sections.length >= MIN_SECTIONS_FOR_CONTENTS;
  const related = legalUi.related.filter((link) => link.href !== legalRoutes[id]);

  return (
    <Container className="pt-8 pb-20 md:pt-10 md:pb-28 lg:pt-12 lg:pb-32 print:max-w-none print:px-0 print:pt-0 print:pb-0">
      <LegalNotice />

      <div className="mt-10 md:mt-14">
        <SectionHeading level={1} eyebrow={legalUi.eyebrow} title={page.title} intro={page.intro} eyebrowRule="neutral" />
        <p className="mt-5 text-sm text-ink-soft md:mt-6">
          {legalUi.lastUpdatedLabel}{" "}
          <time dateTime={page.updated} className="tabular font-medium text-ink">
            {legalUi.formatDate(page.updated)}
          </time>
        </p>
      </div>

      <div
        className={cn(
          "mt-10 md:mt-14 print:mt-8 print:block",
          showContents && "flex flex-col gap-10 md:gap-14 lg:grid lg:grid-cols-12 lg:gap-x-8",
        )}
      >
        {showContents ? <Contents sections={page.sections} numbered={numbered} /> : null}

        <div className={cn("min-w-0", showContents && "lg:col-span-8 lg:col-start-5")}>
          <div className="max-w-[68ch] print:max-w-none">
            {page.sections.map((section, index) => (
              <Section key={section.id} section={section} number={numbered ? index + 1 : undefined} />
            ))}
          </div>

          <nav aria-label={legalUi.relatedLabel} className="mt-4 max-w-[68ch] border-t border-line pt-8 md:mt-6 md:pt-10 print:hidden">
            <p className="label-caps text-ink-soft">{legalUi.relatedLabel}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {related.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-ink/20 ring-inset transition-colors hover:bg-ink/[0.05] hover:ring-ink/40"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* Table of contents                                                   */
/* ------------------------------------------------------------------ */

interface ContentsProps {
  sections: LegalSection[];
  numbered: boolean;
}

/**
 * Article numbers (Terms) are part of the link text, because the text refers
 * to them ("see article 11"). Other documents get a decorative two-digit
 * index, as on /shipping-returns.
 */
function EntryNumber({ index, numbered }: { index: number; numbered: boolean }) {
  return (
    <span aria-hidden={numbered ? undefined : true} className="tabular w-6 shrink-0 text-[13px] text-ink-soft">
      {numbered ? index + 1 : String(index + 1).padStart(2, "0")}
    </span>
  );
}

function Contents({ sections, numbered }: ContentsProps) {
  return (
    <nav aria-label={legalUi.contentsLabel} className="lg:col-span-3 print:hidden">
      {/* Phones and tablets: a closed disclosure. */}
      <details className="group border-y border-line lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="label-caps text-ink">{legalUi.contentsLabel}</span>
          <span className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="tabular">{legalUi.contentsCount(sections.length)}</span>
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full transition-colors group-hover:bg-ink/[0.06]"
            >
              <ChevronDown
                className="size-[18px] motion-safe:transition-transform motion-safe:duration-300 group-open:rotate-180"
                strokeWidth={1.75}
              />
            </span>
          </span>
        </summary>
        <ol className="border-t border-line pb-2">
          {sections.map((section, index) => (
            <li key={section.id} className="border-b border-line last:border-b-0">
              <a
                href={`#${section.id}`}
                className="group/entry flex min-h-11 items-center gap-3 py-2.5 text-[0.9375rem] text-ink"
              >
                <EntryNumber index={index} numbered={numbered} />
                <span className="min-w-0 decoration-ink/40 underline-offset-4 group-hover/entry:underline">
                  {section.heading}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </details>

      {/* lg+: a sticky list that scrolls on its own when it is taller than the window. */}
      <div className="hidden lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:-mx-2 lg:block lg:max-h-[calc(100dvh-var(--header-height)-4rem)] lg:overflow-y-auto lg:overscroll-contain lg:px-2 lg:pb-2">
        <p className="label-caps text-ink-soft">{legalUi.contentsLabel}</p>
        <ol className="mt-4 border-l border-line">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="group/entry -ml-px flex items-baseline gap-2 border-l border-transparent py-[7px] pl-4 text-[0.875rem] leading-snug text-ink transition-colors hover:border-ink/50"
              >
                <EntryNumber index={index} numbered={numbered} />
                <span className="min-w-0 decoration-ink/40 underline-offset-4 group-hover/entry:underline">
                  {section.heading}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Sections and blocks                                                 */
/* ------------------------------------------------------------------ */

function Section({ section, number }: { section: LegalSection; number?: number }) {
  const headingId = `${section.id}-heading`;
  return (
    <section
      id={section.id}
      aria-labelledby={headingId}
      className="border-t border-line py-10 first:border-t-0 first:pt-0 md:py-12 print:py-6"
    >
      <h2 id={headingId} className="flex gap-3 text-[1.5rem] leading-[1.2] break-after-avoid md:text-[1.875rem]">
        {number !== undefined ? <span className="tabular shrink-0 text-ink-soft">{number}.</span> : null}
        <span className="min-w-0">{section.heading}</span>
      </h2>
      <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-ink-soft md:mt-6 md:text-[1.0625rem] print:text-ink">
        {section.body.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </section>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{renderInline(block)}</p>;

  switch (block.kind) {
    case "subheading":
      return (
        <h3 className="mt-4 font-sans text-[1.0625rem] font-semibold tracking-normal text-ink break-after-avoid md:text-lg">
          {renderInline(block.text)}
        </h3>
      );
    case "list":
      return block.ordered ? <OrderedList items={block.items} /> : <BulletList items={block.items} />;
    case "facts":
      return <Facts items={block.items} />;
    case "check":
      return (
        <p className="rounded-lg border border-dashed border-ink/30 px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft break-inside-avoid">
          <span className="label-caps mr-2 text-ink">{legalUi.checkLabel}</span>
          {renderInline(block.text)}
        </p>
      );
  }
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.8em] h-0 w-3 shrink-0 border-t border-ink-soft" />
          <span className="min-w-0">{renderInline(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((item, index) => (
        <li key={item} className="flex gap-4">
          <span
            aria-hidden="true"
            className="tabular mt-px flex size-7 shrink-0 items-center justify-center rounded-full border border-ink/25 text-[13px] font-semibold text-ink"
          >
            {index + 1}
          </span>
          <span className="min-w-0 pt-0.5">{renderInline(item)}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Label and text per row; label above the text on phones, beside it from sm.
 * "\n" in a text starts a new line. As the last block of a section the list
 * drops its bottom rule, so it never doubles the rule between sections.
 */
function Facts({ items }: { items: LegalFact[] }) {
  return (
    <dl className="border-y border-line last:border-b-0">
      {items.map((item) => {
        const lines = item.text.split("\n");
        return (
          <div
            key={item.label}
            className="grid gap-1 border-b border-line py-3 last:border-b-0 break-inside-avoid sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 md:py-3.5"
          >
            <dt className="label-caps pt-[0.3rem] text-ink-soft">{item.label}</dt>
            <dd className="flex flex-col gap-1.5 text-[0.9375rem] leading-relaxed text-ink md:text-base">
              {lines.map((line, index) => (
                <span key={index}>{renderInline(line)}</span>
              ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Inline markup                                                       */
/* ------------------------------------------------------------------ */

/** [label](href) or `code`, as documented in content/legal.ts. */
const INLINE_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;

const linkClass =
  "font-medium text-ink underline decoration-ink/35 underline-offset-[3px] transition-colors hover:decoration-ink";

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  // Internal pages go through next/link; in-page anchors, mailto and external URLs are plain links.
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={linkClass}>
      {children}
    </a>
  );
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    const [whole, label, href, code] = match;
    if (code !== undefined) {
      parts.push(
        <code
          key={start}
          className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.8125em] text-ink [overflow-wrap:anywhere]"
        >
          {code}
        </code>,
      );
    } else if (label !== undefined && href !== undefined) {
      parts.push(
        <InlineLink key={start} href={href}>
          {label}
        </InlineLink>,
      );
    }
    last = start + whole.length;
  }

  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
