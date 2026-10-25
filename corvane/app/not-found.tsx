import type { Metadata } from "next";

import { VANE_PATH, VANE_VIEWBOX } from "@/components/brand/VaneIcon";
import { ArrowRightIcon } from "@/components/home/icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pages } from "@/content/pages";

const copy = pages.notFound;

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  robots: { index: false, follow: true },
};

/** The vane's sub-paths: shaft, arrowhead, tail fin, post, pivot (components/brand/VaneIcon.tsx). */
const [shaft, head, tail, post, pivot] = VANE_PATH.split(/(?=M)/);

/** Pivot of the vane on its 32 x 32 grid: the arrow turns around it, the post stays put. */
const PIVOT = "16px 11.75px";

/**
 * The CORVANE vane pointing the wrong way: the arrow has swung round on its
 * pivot while the post stands still. With motion allowed it searches for a
 * moment (two short swings, under 5 seconds, WCAG 2.2.2) and settles off
 * course; with reduced motion it simply points the wrong way. Decorative.
 */
function OffCourseVane({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={VANE_VIEWBOX} aria-hidden="true" focusable="false" overflow="visible" className={className}>
      <style>{`
        @keyframes corvane-vane-search {
          0% { transform: rotate(0deg); }
          35% { transform: rotate(205deg); }
          65% { transform: rotate(150deg); }
          100% { transform: rotate(168deg); }
        }
        .corvane-vane-arrow { transform-box: view-box; transform-origin: ${PIVOT}; transform: rotate(168deg); }
        @media (prefers-reduced-motion: no-preference) {
          .corvane-vane-arrow { animation: corvane-vane-search 2.4s cubic-bezier(0.32, 0.72, 0, 1) 0.3s both; }
        }
      `}</style>
      <path d={post} fill="currentColor" />
      <g className="corvane-vane-arrow" fill="currentColor">
        <path d={`${shaft}${head}${tail}`} />
      </g>
      <path d={pivot} fill="currentColor" />
    </svg>
  );
}

/**
 * 404 (docs/PLAN.md §1): handles unmatched URLs and notFound() calls. Brand
 * voice headline, one line, and links to the shop, the FAQ and home. The
 * heading is the shared SectionHeading (eyebrow with its rule, h1, intro), as
 * on every other page. The root layout (header, footer) stays around it; the
 * page renders no <main>.
 */
export default function NotFound() {
  const [primary, ...others] = copy.links;

  return (
    <Container className="flex flex-col items-start pt-14 pb-24 md:pt-20 md:pb-32 lg:pt-28 lg:pb-40">
      <OffCourseVane className="size-20 text-ink md:size-24" />

      <SectionHeading
        level={1}
        eyebrow={<span className="tabular">{copy.eyebrow}</span>}
        title={copy.headline}
        intro={copy.line}
        eyebrowRule="neutral"
        className="mt-10 md:mt-12"
      />

      <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-center">
        {primary ? (
          <Button
            href={primary.href}
            variant="primary"
            iconEnd={<ArrowRightIcon className="size-[18px]" />}
            className="col-span-2"
          >
            {primary.label}
          </Button>
        ) : null}
        {others.map((link) => (
          <Button key={link.href} href={link.href} variant="outline" className="px-4 sm:px-6">
            {link.label}
          </Button>
        ))}
      </div>
    </Container>
  );
}
