"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { Wordmark } from "@/components/brand/Wordmark";
import { isCurrentPage } from "@/components/layout/header/nav";
import { DESKTOP_QUERY, useMediaQuery } from "@/components/layout/promo/useMediaQuery";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Mobile menu (< lg): the hamburger button and a Sheet from the left with the
 * main links (site.nav) in large serif, the help links (site.helpLinks) and
 * the tagline. Radix provides the focus trap, Esc, overlay click and focus
 * return to the hamburger.
 *
 * Open state is remembered together with the pathname it was opened on, so
 * the menu closes by itself on any route change (link, back button) without
 * an effect, and also when the viewport grows to lg (the button is hidden there).
 */
export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const desktop = useMediaQuery(DESKTOP_QUERY, false);
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname && !desktop;
  const close = () => setOpenedOn(null);

  return (
    <Sheet
      side="left"
      size="sm"
      open={open}
      onOpenChange={(next) => setOpenedOn(next ? pathname : null)}
      trigger={
        <Button variant="ghost" iconOnly aria-label={site.header.openMenu} className={cn("lg:hidden", className)}>
          <Menu aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
        </Button>
      }
      title={site.header.menuTitle}
      hideTitle
      headerExtra={<Wordmark decorative className="h-[15px] w-auto" />}
      closeLabel={site.header.closeMenu}
      bodyClassName="flex flex-col"
    >
      <nav aria-label={site.header.mainNavLabel}>
        <ul className="-mt-1 flex flex-col">
          {site.nav.map((link) => {
            const current = isCurrentPage(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  aria-current={current ? "page" : undefined}
                  className="flex items-center gap-3 py-2 font-serif text-[2rem] leading-[1.15] font-semibold tracking-[-0.015em] text-ink"
                >
                  {link.label}
                  {current ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-signal" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label={site.header.helpNavLabel} className="mt-8 border-t border-line pt-5">
        <ul className="flex flex-col">
          {site.helpLinks.map((link) => {
            const current = isCurrentPage(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center text-[15px] transition-colors",
                    current ? "font-medium text-ink" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-auto flex items-center gap-2.5 pt-10 text-sm text-ink-soft">
        <VaneIcon className="size-5 text-ink" />
        {site.tagline}
      </p>
    </Sheet>
  );
}
