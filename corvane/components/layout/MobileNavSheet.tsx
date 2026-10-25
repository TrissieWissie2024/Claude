"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { Wordmark } from "@/components/brand/Wordmark";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { isCurrentPage } from "@/components/layout/header/nav";
import { DiscoverySetRender } from "@/components/media/DiscoverySetRender";
import { Sheet, type SheetProps } from "@/components/ui/Sheet";
import { offers } from "@/content/offers";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

/**
 * The sheet of the mobile menu (< lg), loaded lazily by MobileNav (which
 * renders the hamburger button and owns the open state): a Sheet from the
 * left with the main links (site.nav) in large serif, the help links
 * (site.helpLinks), a Discovery Set card (site.header.menuFeature; name,
 * tagline and price from the catalog and offers) and the tagline, stacked
 * from the top. Radix provides the focus trap, Esc and overlay click; focus
 * returns to the hamburger (onCloseAutoFocus from MobileNav).
 */
function MenuFeature({ onNavigate }: { onNavigate: () => void }) {
  const { findProduct, sticks } = useCatalog();
  const feature = site.header.menuFeature;
  const product = findProduct(feature.productSlug);
  if (!product) return null;

  return (
    <Link
      href={feature.href}
      onClick={onNavigate}
      className="group mt-8 flex items-center gap-4 rounded-card bg-sand py-3 pr-4 pl-3"
    >
      <span aria-hidden="true" className="flex h-[5.5rem] w-[4.4rem] shrink-0 items-center justify-center">
        <DiscoverySetRender
          decorative
          className="h-full w-auto"
          scents={sticks.map((stick) => ({ name: stick.name, ringColor: stick.ringColor }))}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="label-caps block text-ink-soft">{feature.eyebrow}</span>
        <span className="mt-1 block font-serif text-xl leading-tight font-semibold tracking-[-0.015em] text-ink decoration-1 underline-offset-4 group-hover:underline">
          {product.name}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{product.tagline}</span>
        <span className="tabular mt-1.5 block text-sm font-semibold text-ink">
          {formatMoney(offers.prices.discoverySet)}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 text-ink motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5"
        strokeWidth={1.75}
      />
    </Link>
  );
}

export interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when a link in the menu is followed. */
  onNavigate: () => void;
  onCloseAutoFocus?: SheetProps["onCloseAutoFocus"];
}

export function MobileNavSheet({ open, onOpenChange, onNavigate, onCloseAutoFocus }: MobileNavSheetProps) {
  const pathname = usePathname();
  const close = onNavigate;

  return (
    <Sheet
      side="left"
      size="sm"
      open={open}
      onOpenChange={onOpenChange}
      title={site.header.menuTitle}
      hideTitle
      headerExtra={<Wordmark decorative className="h-[15px] w-auto" />}
      closeLabel={site.header.closeMenu}
      bodyClassName="flex flex-col"
      onCloseAutoFocus={onCloseAutoFocus}
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

      <MenuFeature onNavigate={close} />

      <p className="mt-8 flex items-center gap-2.5 pb-2 text-sm text-ink-soft">
        <VaneIcon className="size-5 text-ink" />
        {site.tagline}
      </p>
    </Sheet>
  );
}
