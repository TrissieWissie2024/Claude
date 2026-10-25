"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isCurrentPage } from "@/components/layout/header/nav";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Horizontal main navigation for lg+ (site.nav). The current page gets
 * aria-current="page" and a hairline underline; other links show it on hover.
 * Tighter (13 px, 12 px gaps) from lg to xl, so it keeps clear of the centred
 * wordmark at 1024 px; 14 px with 32 px gaps from xl.
 */
export function DesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={site.header.mainNavLabel} className={cn("hidden lg:block", className)}>
      <ul className="-ml-1 flex items-center gap-3 xl:gap-8">
        {site.nav.map((link) => {
          const current = isCurrentPage(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "group relative inline-flex h-11 items-center px-1 text-[13px] font-medium whitespace-nowrap transition-colors xl:text-sm",
                  current ? "text-ink" : "text-ink/75 hover:text-ink",
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-1 bottom-2.5 h-px origin-left bg-ink motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
                    current ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
