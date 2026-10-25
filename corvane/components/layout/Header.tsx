import { User } from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { CartButton } from "@/components/layout/header/CartButton";
import { DesktopNav } from "@/components/layout/header/DesktopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";

/**
 * Sticky site header (brief §6.2, docs/PLAN.md §1). Server component; the
 * interactive parts are small client islands (MobileNav, DesktopNav, CartButton).
 *
 * Three columns, so the wordmark stays centred whatever sits beside it:
 * - mobile: hamburger | wordmark | account + cart
 * - lg+:    main nav  | wordmark | account + cart
 *
 * Solid fog, not translucent: dark sections never show through as a grey band.
 * Exactly var(--header-height) tall, z-30 (PLAN §10). Must be rendered inside
 * <CartProvider> and must not sit in an ancestor with overflow other than
 * visible, or `sticky` stops working.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 h-header border-b border-line bg-fog print:hidden">
      <Container className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex min-w-0 items-center justify-start">
          <MobileNav className="-ml-3" />
          <DesktopNav />
        </div>

        <Link href="/" aria-label={site.header.homeLabel} className="flex min-h-11 items-center py-2">
          <Wordmark decorative className="h-[17px] w-auto lg:h-[21px]" />
        </Link>

        <div className="-mr-3 flex items-center justify-end">
          <Button href="/account" variant="ghost" iconOnly aria-label={site.header.account}>
            <User aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
          </Button>
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
