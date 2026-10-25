import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stars } from "@/components/ui/Stars";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";
import { getRatingSummary, getReviews } from "@/lib/reviews";
import type { Review } from "@/lib/types";

/**
 * Reviews (brief §6.10, §2.2; docs/PLAN.md §4.9). Real reviews only, from
 * content/reviews.ts via lib/reviews.ts.
 *
 * - No reviews (launch): an honest empty state. The heading itself says it
 *   ("No reviews yet.", home.reviews.emptyTitle) with home.reviews.empty.body
 *   as the intro, in a shorter section: no card, no icon, no stars, no zero
 *   score, no count, no prompt to write one. "From verified buyers" (or the
 *   `heading` prop) waits for real reviews.
 * - With reviews: the rating summary (Stars + count) beside the heading and a
 *   list of review cards with stars, title, text, author, date, the
 *   verified-purchase label and the source.
 *
 * Works on the homepage (all reviews) and on the product page
 * (`productSlug`, `headingLevel` 2 or 3). No hooks and no server-only APIs,
 * so it renders in server and client trees alike.
 */

export interface ReviewsSectionProps {
  /** Only reviews of this product. Omit for all reviews (homepage). */
  productSlug?: string;
  /** Level of the section heading. Review titles and the empty state heading go one level below. Default 2. */
  headingLevel?: 2 | 3;
  /** Section id (anchor). Default home.reviews.id ("reviews"). */
  id?: string;
  eyebrow?: string;
  heading?: string;
  /** Most reviews to show, newest first. Default 6. */
  limit?: number;
  /** Hairline above the section, aligned to the container. */
  divider?: boolean;
  /**
   * Review data. Defaults to content/reviews.ts; only tests and previews pass
   * this. Never pass invented reviews on a live page (brief §2.2).
   */
  source?: readonly Review[];
  className?: string;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

/** "12 October 2026" from an ISO date. Deterministic: fixed locale and time zone. */
function formatReviewDate(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : dateFormat.format(date);
}

export function ReviewsSection({
  productSlug,
  headingLevel = 2,
  id = home.reviews.id,
  eyebrow = home.reviews.label,
  heading = home.reviews.heading,
  limit = 6,
  divider = false,
  source,
  className,
}: ReviewsSectionProps) {
  const copy = home.reviews;
  const reviews = source ? getReviews(productSlug, source) : getReviews(productSlug);
  const summary = source ? getRatingSummary(productSlug, source) : getRatingSummary(productSlug);
  const shown = reviews.slice(0, Math.max(0, limit));
  const headingId = `${id}-heading`;
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4";

  const empty = shown.length === 0 || !summary;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("bg-fog text-ink", className)}>
      <Container>
        <div
          className={cn(
            // Empty: one statement, so a shorter section (no dead zone between its neighbours).
            empty ? "py-14 md:py-20 lg:py-24" : "py-20 md:py-28 lg:py-32",
            divider && "border-t border-line",
          )}
        >
          {empty ? (
            <SectionHeading
              id={headingId}
              level={headingLevel}
              eyebrow={eyebrow}
              title={copy.emptyTitle}
              intro={copy.empty.body}
            />
          ) : (
            <>
              <SectionHeading
                id={headingId}
                level={headingLevel}
                eyebrow={eyebrow}
                title={heading}
                action={
                  <p className="flex items-center gap-3">
                    <Stars rating={summary} size="md" showCount={false} />
                    <span className="tabular text-[0.9375rem] text-ink-soft">
                      {summary.average.toFixed(1)} · {copy.count(summary.count)}
                    </span>
                  </p>
                }
              />
              <ul className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {shown.map((review) => (
                  <li key={review.id} className="flex">
                    <article className="flex w-full flex-col rounded-card bg-white/60 p-6 shadow-soft ring-1 ring-line ring-inset md:p-7">
                      <Stars
                        rating={{ average: review.rating, count: 1 }}
                        showCount={false}
                        label={() => copy.ratingLabel(review.rating)}
                      />
                      <SubHeading className="mt-4 text-xl leading-snug">{review.title}</SubHeading>
                      <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{review.body}</p>
                      <footer className="mt-6 flex flex-col gap-1 border-t border-line pt-4 text-sm">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-ink">{review.author}</span>
                          {review.verifiedPurchase ? (
                            <span className="label-caps rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] text-ink">
                              {copy.verifiedBuyer}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-ink-soft">
                          <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                          <span aria-hidden="true"> · </span>
                          <span className="sr-only">, </span>
                          {copy.source(review.source)}
                        </p>
                      </footer>
                    </article>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
