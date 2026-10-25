import Link from "next/link";

import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faq } from "@/content/faq";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";
import type { FaqItem, NavLink } from "@/lib/types";

import { ArrowRightIcon } from "./icons";

/**
 * FAQ section (brief §6.11, docs/PLAN.md §4.11) with the Radix Accordion from
 * components/ui. Homepage default: the questions marked `onHome` in
 * content/faq.ts and a link "All questions" to /faq. On the product page pass
 * the `onProduct` questions (see `faqItemsFor`), and an `id` if "faq" is taken.
 *
 * Mobile: heading, questions, then the link. lg+: heading and link on the
 * left (4 columns), questions on the right (7 columns).
 */

export interface FaqSectionProps {
  /** Questions to show. Default: the onHome questions. */
  items?: FaqItem[];
  /** Section id (anchor). Default home.faq.id ("faq"). */
  id?: string;
  eyebrow?: string;
  heading?: string;
  /** Level of the section heading; the questions go one level below. Default 2. */
  headingLevel?: 2 | 3;
  /** Link under the heading. Default "All questions" -> /faq; pass null for none. */
  link?: NavLink | null;
  /** Show the "Something else? Contact us" line. Default true. */
  showContact?: boolean;
  /** Hairline above the section, aligned to the container. For a fog section that follows another fog section. */
  divider?: boolean;
  /** Rule before the eyebrow (SectionHeading). Default "signal"; the product page uses "neutral". */
  eyebrowRule?: "signal" | "neutral";
  className?: string;
}

/**
 * The questions for a placement, in content order. On the homepage an answer
 * in home.faq.interimAnswers replaces the content/faq.ts one of the same id
 * (until the scent finder ships, "which-scent" must not point to it; D38).
 */
export function faqItemsFor(placement: "home" | "product"): FaqItem[] {
  if (placement === "product") return faq.filter((item) => item.onProduct);
  const overrides = home.faq.interimAnswers;
  return faq
    .filter((item) => item.onHome)
    .map((item) => {
      const answer = overrides[item.id];
      return answer ? { ...item, answer } : item;
    });
}

export function FaqSection({
  items = faqItemsFor("home"),
  id = home.faq.id,
  eyebrow = home.faq.label,
  heading = home.faq.heading,
  headingLevel = 2,
  link = home.faq.link,
  showContact = true,
  divider = false,
  eyebrowRule,
  className,
}: FaqSectionProps) {
  if (items.length === 0) return null;
  const headingId = `${id}-heading`;
  const contact = home.faq.contact;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div
          className={cn(
            "grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-10 lg:py-32",
            divider && "border-t border-line",
          )}
        >
          <SectionHeading
            id={headingId}
            level={headingLevel}
            eyebrow={eyebrow}
            title={heading}
            eyebrowRule={eyebrowRule}
            className="lg:col-span-4"
          />

          <Accordion
            items={items.map((item) => ({ id: item.id, title: item.question, content: <p>{item.answer}</p> }))}
            headingLevel={headingLevel === 2 ? 3 : 4}
            className="lg:col-span-7 lg:col-start-6 lg:row-span-2"
          />

          {link || showContact ? (
            <div className="flex flex-col items-start gap-5 lg:col-span-4 lg:col-start-1 lg:row-start-2">
              {link ? (
                <Link
                  href={link.href}
                  className="group inline-flex min-h-11 items-center gap-2 text-base font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-ink"
                >
                  {link.label}
                  <ArrowRightIcon className="size-[18px] motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" />
                </Link>
              ) : null}
              {showContact ? (
                <p className="text-[0.9375rem] text-ink-soft">
                  {contact.text}{" "}
                  <Link
                    href={contact.link.href}
                    className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                  >
                    {contact.link.label}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
