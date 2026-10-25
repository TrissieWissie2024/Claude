import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pages } from "@/content/pages";

const copy = pages.account;

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  robots: { index: false, follow: true },
};

/**
 * /account (brief §6 "Account (stub)", docs/PLAN.md §1). Customer accounts
 * arrive later, so this page says so plainly and offers help instead. There is
 * deliberately no sign-in form: fields that do nothing would be a pretence.
 *
 * Phones: heading, the note on accounts, then the help links. lg+: the note on
 * the left (5 columns), the help links on the right (7 columns).
 */
export default function AccountPage() {
  const { signIn, orderHelp } = copy;

  return (
    <Container className="pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
      <SectionHeading level={1} eyebrow={copy.eyebrow} title={copy.h1} eyebrowRule="neutral" />

      <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-x-8">
        <section aria-labelledby="account-sign-in" className="rounded-card bg-sand p-6 md:p-8 lg:col-span-5 lg:self-start">
          <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-fog text-ink">
            <UserRound className="size-5" strokeWidth={1.75} />
          </span>
          <h2 id="account-sign-in" className="mt-6 text-[1.625rem] leading-[1.15] md:text-[2rem]">
            {signIn.heading}
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-base leading-relaxed text-ink-soft">
            {signIn.body.map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? "text-ink" : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section aria-labelledby="account-order-help" className="lg:col-span-7 lg:col-start-6">
          <h2 id="account-order-help" className="text-[1.625rem] leading-[1.15] md:text-[2rem]">
            {orderHelp.heading}
          </h2>
          <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-ink-soft md:text-lg">{orderHelp.body}</p>

          <ul className="mt-8 border-t border-line">
            {orderHelp.links.map((link) => (
              <li key={link.href} className="border-b border-line">
                <Link
                  href={link.href}
                  className="group flex min-h-11 items-center justify-between gap-6 py-5 text-ink no-underline md:py-6"
                >
                  <span className="min-w-0">
                    <span className="block text-[1.0625rem] font-semibold decoration-ink/40 underline-offset-4 group-hover:underline">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-[0.9375rem] leading-snug text-ink-soft">{link.description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-ink/20 ring-inset transition-colors group-hover:bg-ink group-hover:text-fog"
                  >
                    <ArrowRightIcon className="size-[18px]" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Container>
  );
}
