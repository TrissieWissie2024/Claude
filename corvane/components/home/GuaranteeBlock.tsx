import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

import { ArrowRightIcon, ReturnIcon, SwapIcon, type LineIcon } from "./icons";

/**
 * Guarantee (brief §4 and §6.11, docs/PLAN.md §4.10 and §13) on kelp.
 *
 * The voluntary guarantee (offers.guaranteeDays) in plain words: what it
 * means and its main condition, each with an icon, plus a link to the full
 * conditions on /shipping-returns#guarantee.
 *
 * Opener: eyebrow "30-day guarantee", h2 "Wrong scent? Send it back." and a
 * short lead, so each fact is said once. The decorative "30 days" seal only
 * shows from lg, where it anchors the left column; on phones it would push
 * the heading down without adding anything.
 *
 * The statutory right of withdrawal is not a perk (docs/PLAN.md §13): it is
 * not one of the guarantee points, has no icon and no emphasis. It sits under
 * them as a quiet note ("On top of your rights") that says the guarantee comes
 * in addition to it, with a plain link to /shipping-returns#withdrawal.
 */

export interface GuaranteeBlockProps {
  className?: string;
}

const pointIcons: Partial<Record<string, LineIcon>> = {
  what: SwapIcon,
  condition: ReturnIcon,
};

export function GuaranteeBlock({ className }: GuaranteeBlockProps) {
  const { id, heading, title, leadShort, points, link, seal, rightsLink } = home.guarantee;
  const headingId = `${id}-heading`;
  const rights = points.find((point) => point.id === "rights");
  const mainPoints = points.filter((point) => point.id !== "rights");

  return (
    <section id={id} aria-labelledby={headingId} className={cn("focus-on-dark bg-kelp text-fog", className)}>
      <Container className="grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-8 lg:py-32">
        <div className="lg:col-span-5">
          {/* Decorative seal (lg+): the eyebrow says the same in words. */}
          <div
            aria-hidden="true"
            className="mb-12 hidden size-32 flex-col items-center justify-center rounded-full border border-fog/30 lg:flex"
          >
            <span className="tabular font-serif text-[2.75rem] leading-none md:text-[3.25rem]">{seal.value}</span>
            <span className="label-caps mt-1.5 text-mist">{seal.unit}</span>
          </div>

          <SectionHeading id={headingId} tone="dark" eyebrow={heading} title={title} intro={leadShort} />

          <Button
            href={link.href}
            variant="outline-on-dark"
            className="mt-8 md:mt-10"
            iconEnd={<ArrowRightIcon className="size-[18px]" />}
          >
            {link.label}
          </Button>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <dl className="border-t border-line-on-deep">
            {mainPoints.map((point) => {
              const Icon = pointIcons[point.id];
              return (
                <div key={point.id} className="relative border-b border-line-on-deep py-7 pl-16 md:py-8 md:pl-[4.5rem]">
                  <dt className="pt-2 font-serif text-xl leading-snug text-fog md:pt-2.5 md:text-[1.375rem]">
                    {Icon ? (
                      <span className="absolute top-7 left-0 flex size-11 items-center justify-center rounded-full bg-fog/10 text-fog md:top-8 md:size-12">
                        <Icon className="size-[22px] md:size-6" />
                      </span>
                    ) : null}
                    {point.title}
                  </dt>
                  <dd className="mt-2 text-[0.9375rem] leading-relaxed text-mist md:text-base">{point.text}</dd>
                </div>
              );
            })}
          </dl>

          {rights ? (
            <div className="mt-8 md:mt-10">
              <p className="label-caps text-mist">{rights.title}</p>
              <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-mist">
                {rights.text}{" "}
                <Link
                  href={rightsLink.href}
                  className="text-fog underline decoration-fog/40 underline-offset-4 hover:decoration-fog"
                >
                  {rightsLink.label}
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
