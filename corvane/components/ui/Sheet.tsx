"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { MotionStyles } from "@/components/ui/MotionStyles";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Side drawer on Radix Dialog: focus trap, Esc and overlay click close, focus
 * returns to the trigger (or to the element that had focus when it opened),
 * the page behind is inert and does not scroll.
 * Slides in from `side` only with motion allowed. z-index 60 (PLAN §10).
 *
 * Controlled (`open` + `onOpenChange`) or uncontrolled (`trigger`, optional
 * `defaultOpen`).
 */

export type SheetSide = "left" | "right";

export type SheetSize = "sm" | "md" | "lg";

type ContentProps = ComponentPropsWithoutRef<typeof Dialog.Content>;

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the sheet (rendered with Radix asChild, e.g. a <Button>). */
  trigger?: ReactNode;
  side?: SheetSide;
  /** sm 22rem, md 28rem (default), lg 36rem; never wider than the viewport minus 1.5rem. */
  size?: SheetSize;
  title: ReactNode;
  /** Keep the title for screen readers but do not show it. */
  hideTitle?: boolean;
  description?: ReactNode;
  hideDescription?: boolean;
  /** Extra content in the header row, after the title (e.g. an item count or a logo). */
  headerExtra?: ReactNode;
  /** Sticky area under the scrolling body (e.g. totals and the checkout button). */
  footer?: ReactNode;
  /** Accessible name of the close button. Default site.ui.close ("Close"). */
  closeLabel?: string;
  /** Padding around the body. Default true. */
  padded?: boolean;
  /** "dark" renders on deep. */
  tone?: "light" | "dark";
  className?: string;
  bodyClassName?: string;
  onOpenAutoFocus?: ContentProps["onOpenAutoFocus"];
  onCloseAutoFocus?: ContentProps["onCloseAutoFocus"];
  children?: ReactNode;
}

const widths: Record<SheetSize, string> = {
  sm: "w-[min(calc(100vw-1.5rem),22rem)]",
  md: "w-[min(calc(100vw-1.5rem),28rem)]",
  lg: "w-[min(calc(100vw-1.5rem),36rem)]",
};

const sideClasses: Record<SheetSide, string> = {
  right:
    "right-0 rounded-l-card motion-safe:data-[state=open]:animate-[corvane-sheet-in-right_360ms_cubic-bezier(0.32,0.72,0,1)] motion-safe:data-[state=closed]:animate-[corvane-sheet-out-right_240ms_cubic-bezier(0.4,0,1,1)]",
  left: "left-0 rounded-r-card motion-safe:data-[state=open]:animate-[corvane-sheet-in-left_360ms_cubic-bezier(0.32,0.72,0,1)] motion-safe:data-[state=closed]:animate-[corvane-sheet-out-left_240ms_cubic-bezier(0.4,0,1,1)]",
};

export const overlayClasses =
  "fixed inset-0 z-60 bg-ink/45 motion-safe:data-[state=open]:animate-[corvane-fade-in_300ms_ease-out] motion-safe:data-[state=closed]:animate-[corvane-fade-out_240ms_ease-in]";

export function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  side = "right",
  size = "md",
  title,
  hideTitle = false,
  description,
  hideDescription = false,
  headerExtra,
  footer,
  closeLabel = site.ui.close,
  padded = true,
  tone = "light",
  className,
  bodyClassName,
  onOpenAutoFocus,
  onCloseAutoFocus,
  children,
}: SheetProps) {
  const dark = tone === "dark";

  // Radix returns focus to its Trigger. Opened without one (controlled, e.g.
  // the cart after "Add to cart"), focus goes back to the element that had it.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const handleOpenAutoFocus: ContentProps["onOpenAutoFocus"] = (event) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    onOpenAutoFocus?.(event);
  };
  const handleCloseAutoFocus: ContentProps["onCloseAutoFocus"] = (event) => {
    onCloseAutoFocus?.(event);
    if (event.defaultPrevented || trigger) return;
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target?.isConnected) {
      event.preventDefault();
      target.focus({ preventScroll: true });
    }
  };

  return (
    <Dialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <MotionStyles />
        <Dialog.Overlay className={overlayClasses} />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          className={cn(
            "fixed inset-y-0 z-60 flex h-dvh max-h-dvh flex-col overflow-hidden shadow-lift outline-none",
            dark ? "focus-on-dark bg-deep text-fog" : "bg-fog text-ink",
            widths[size],
            sideClasses[side],
            className,
          )}
        >
          <div
            className={cn(
              "flex min-h-16 shrink-0 items-center gap-3 border-b px-5 py-3 md:px-6",
              dark ? "border-line-on-deep" : "border-line",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Dialog.Title className={cn(hideTitle ? "sr-only" : "truncate text-[1.375rem] leading-tight")}>
                {title}
              </Dialog.Title>
              {headerExtra}
            </div>
            <Dialog.Close asChild>
              <Button
                variant={dark ? "ghost-on-dark" : "ghost"}
                size="sm"
                iconOnly
                aria-label={closeLabel}
                className="-mr-2"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </Button>
            </Dialog.Close>
          </div>

          {description ? (
            <Dialog.Description
              className={cn(
                hideDescription ? "sr-only" : "px-5 pt-4 text-sm md:px-6",
                dark ? "text-mist" : "text-ink-soft",
              )}
            >
              {description}
            </Dialog.Description>
          ) : null}

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              padded && "px-5 py-5 md:px-6",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer ? (
            <div
              className={cn(
                "shrink-0 border-t px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6",
                dark ? "border-line-on-deep bg-deep" : "border-line bg-fog",
              )}
            >
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
