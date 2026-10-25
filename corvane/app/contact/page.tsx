import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { ArrowRightIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pages } from "@/content/pages";
import { pageMetadata } from "@/lib/seo";

const copy = pages.contact;

export const metadata: Metadata = pageMetadata({
  title: copy.meta.title,
  description: copy.meta.description,
  path: "/contact",
});

/**
 * /contact (brief §6, docs/PLAN.md §1): heading, intro, the email address and
 * the demo contact form (components/contact/ContactForm, POST /api/contact,
 * a stub that stores nothing). Quick links to the FAQ and Shipping & Returns
 * follow, since most questions are answered there.
 *
 * Phones: heading and email, the form, then the quick links. lg+: heading,
 * email and quick links on the left (5 columns), the form on the right (7).
 */
export default function ContactPage() {
  const { emailLine, shortcuts } = copy;

  return (
    <Container className="pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
      <div className="grid gap-12 md:gap-14 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-14">
        <div className="lg:col-span-5">
          <SectionHeading level={1} eyebrow={copy.eyebrow} title={copy.h1} intro={copy.intro} eyebrowRule="neutral" />

          <div className="mt-10 border-t border-line pt-6 md:mt-12">
            <p className="label-caps text-ink-soft">{copy.emailLabel}</p>
            <p className="mt-2 font-serif text-[1.375rem] leading-tight md:text-[1.625rem]">
              <a
                href={`mailto:${emailLine.email}`}
                className="break-all text-ink underline decoration-ink/25 decoration-1 underline-offset-[6px] hover:decoration-ink"
              >
                {emailLine.email}
              </a>
            </p>
            {/* Like the other company details, the address is marked until the real mailbox exists. */}
            {emailLine.note ? <p className="mt-2 text-sm text-ink-soft">{emailLine.note}</p> : null}
          </div>
        </div>

        <ContactForm className="lg:col-span-7 lg:col-start-6 lg:row-span-2" />

        <section aria-labelledby="contact-shortcuts" className="border-t border-line pt-6 lg:col-span-5 lg:row-start-2 lg:self-start">
          <h2 id="contact-shortcuts" className="font-sans text-base font-semibold tracking-normal text-ink">
            {shortcuts.heading}
          </h2>
          <p className="mt-2 max-w-[26rem] text-[0.9375rem] leading-relaxed text-ink-soft">{shortcuts.body}</p>
          <ul className="mt-3 flex flex-col">
            {shortcuts.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-ink"
                >
                  {link.label}
                  <ArrowRightIcon className="size-[18px] motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Container>
  );
}
