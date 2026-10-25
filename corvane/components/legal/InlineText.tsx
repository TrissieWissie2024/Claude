import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Inline markup for content strings, as documented in content/legal.ts:
 * [label](href) is a link ("/..." internal through next/link; "#...",
 * "mailto:" and "https:" as plain links, same tab) and `text` is code. Used by
 * the legal pages and /shipping-returns. Server-safe, no client JavaScript.
 */

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

/** Renders a string with inline links and code; returns the string itself when it has no markup. */
export function renderInline(text: string): ReactNode {
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
