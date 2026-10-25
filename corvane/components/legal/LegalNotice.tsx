import { legalReviewNotice, legalUi } from "@/content/legal";
import { cn } from "@/lib/cn";

export interface LegalNoticeProps {
  /** Notice text. Default `legalReviewNotice`, the exact text the brief requires (§6). */
  text?: string;
  className?: string;
}

/**
 * The legal review notice: "TODO: laten controleren" (brief §6, docs/PLAN.md
 * §1). Sits at the very top of every legal page and of /shipping-returns
 * until a lawyer has checked the text.
 *
 * A small bordered note, as wide as its content: a visible label in label
 * caps ("Draft", no icon), a hairline, then the exact Dutch text with
 * lang="nl" so screen readers pronounce it in Dutch. The dashed border is the
 * same language as the placeholders elsewhere: this is not finished yet. It
 * prints as well, so a printed draft is never mistaken for the final text.
 */
export function LegalNotice({ text = legalReviewNotice, className }: LegalNoticeProps) {
  return (
    <div
      role="note"
      aria-label={legalUi.reviewNoticeLabel}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-ink/40 bg-sand/60 px-3.5 py-2 print:bg-transparent",
        className,
      )}
    >
      <span className="label-caps text-ink-soft">{legalUi.reviewNoticeTag}</span>
      <span aria-hidden="true" className="h-3.5 border-l border-ink/25" />
      <p lang="nl" className="text-sm font-semibold text-ink">
        {text}
      </p>
    </div>
  );
}
