"use client";

import { Menu } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { DESKTOP_QUERY, useMediaQuery } from "@/components/layout/promo/useMediaQuery";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { useAfterLoad, useLatch } from "@/lib/hooks/useAfterLoad";

/** The sheet (Radix Dialog, links, Discovery Set card) in a chunk of its own. */
const MobileNavSheet = dynamic(
  () => import("@/components/layout/MobileNavSheet").then((module) => module.MobileNavSheet),
  { ssr: false },
);

/**
 * Mobile menu (< lg): the hamburger button, server-rendered, and the menu
 * sheet (components/layout/MobileNavSheet), whose code loads once the page
 * has settled (useAfterLoad: loaded and idle, or the first interaction; a
 * tap on the button is one) or when the button is used before that. So the
 * dialog code is not part of the initial JavaScript (phase 8).
 *
 * The button is a plain button with aria-haspopup="dialog" and aria-expanded
 * (what Radix's Dialog.Trigger set before); closing the sheet returns focus
 * to it.
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  const settled = useAfterLoad();
  const needed = useLatch(open);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        iconOnly
        aria-label={site.header.openMenu}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenedOn(pathname)}
        className={cn("lg:hidden", className)}
      >
        <Menu aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
      </Button>
      {settled || needed ? (
        <MobileNavSheet
          open={open}
          onOpenChange={(next) => setOpenedOn(next ? pathname : null)}
          onNavigate={close}
          onCloseAutoFocus={(event) => {
            const button = buttonRef.current;
            if (!button?.isConnected || button.getClientRects().length === 0) return;
            event.preventDefault();
            button.focus({ preventScroll: true });
          }}
        />
      ) : null}
    </>
  );
}
