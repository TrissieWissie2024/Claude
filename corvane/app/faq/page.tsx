import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/home/icons";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faq } from "@/content/faq";
import { pages } from "@/content/pages";

const copy = pages.faq;

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  alternates: { canonical: "/faq" },
};

/** Categories that have questions, in the order of pages.faq.categories. */
const groups = copy.categories
  .map((category) => ({ ...category, items: faq.filter((item) => item.category === category.id) }))
  .filter((group) => group.items.length > 0);

/**
 * /faq (docs/PLAN.md §1): every question in content/faq.ts, grouped by
 * category. One Radix Accordion per category (several answers can be open at
 * once), with links to each category at the top and a contact block at the end.
 *
 * The category links are plain in-page anchors (<a href="#shipping">), so the
 * focus starting point moves with the jump (WCAG 2.4.3, D43.10); the sticky
 * header is covered by scroll-padding-top in globals.css.
 *
 * Phones: heading, the category links as wrapping chips, then the categories.
 * lg+: the links as a sticky list on the left (3 columns), the questions on
 * the right (8 columns).
 */
export default function FaqPage() {
  return (
    <Container className="pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
      <SectionHeading level={1} eyebrow={copy.eyebrow} title={copy.h1} intro={copy.intro} eyebrowRule="neutral" />

      <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-x-8">
        <nav aria-label={copy.navLabel} className="lg:col-span-3">
          <ul className="flex flex-wrap gap-2 lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:flex-col lg:gap-0 lg:border-t lg:border-line">
            {groups.map((group) => (
              <li key={group.id} className="lg:border-b lg:border-line">
                <a
                  href={`#${group.id}`}
                  className="flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-ink/20 ring-inset transition-colors hover:bg-ink/[0.05] hover:ring-ink/40 lg:justify-between lg:rounded-none lg:px-0 lg:py-3 lg:text-[0.9375rem] lg:ring-0 lg:hover:bg-transparent lg:hover:underline lg:hover:decoration-ink/40 lg:hover:underline-offset-4"
                >
                  {group.label}
                  <span className="tabular hidden text-[13px] font-normal text-ink-soft lg:inline">
                    <span className="sr-only">, </span>
                    {group.items.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-14 md:gap-16 lg:col-span-8 lg:col-start-5">
          {groups.map((group) => {
            const headingId = `${group.id}-heading`;
            const link = copy.categoryLinks[group.id];
            return (
              <section key={group.id} id={group.id} aria-labelledby={headingId}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 id={headingId} className="text-[1.625rem] leading-[1.15] md:text-[2.125rem]">
                    {group.label}
                  </h2>
                  <p className="label-caps tabular shrink-0 text-ink-soft lg:hidden">{copy.questionCount(group.items.length)}</p>
                </div>
                <Accordion
                  type="multiple"
                  headingLevel={3}
                  className="mt-5 md:mt-6"
                  items={group.items.map((item) => ({
                    id: item.id,
                    title: item.question,
                    content: <p className="max-w-[34rem]">{item.answer}</p>,
                  }))}
                />
                {link ? (
                  <Link
                    href={link.href}
                    className="group mt-4 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-ink"
                  >
                    {link.label}
                    <ArrowRightIcon className="size-[18px] motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </section>
            );
          })}

          <section
            aria-labelledby="faq-contact-heading"
            className="flex flex-col items-start gap-6 rounded-card bg-sand p-6 md:flex-row md:items-center md:justify-between md:p-8"
          >
            <div>
              <h2 id="faq-contact-heading" className="text-[1.625rem] leading-[1.15] md:text-[2rem]">
                {copy.contact.heading}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">{copy.contact.body}</p>
            </div>
            <Button
              href={copy.contact.link.href}
              variant="secondary"
              iconEnd={<ArrowRightIcon className="size-[18px]" />}
            >
              {copy.contact.link.label}
            </Button>
          </section>
        </div>
      </div>
    </Container>
  );
}
