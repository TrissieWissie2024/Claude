"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { MotionStyles } from "@/components/ui/MotionStyles";
import { overlayClasses } from "@/components/ui/Sheet";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Centred dialog on Radix Dialog, with the same API as Sheet (minus `side`):
 * focus trap, Esc and overlay click close, focus returns to the trigger (or
 * to the element that had focus when it opened).
 * Fades and lifts in only with motion allowed. z-index 60 (PLAN §10).
 *
 * `anchor`: "center" (default) centres the dialog in the viewport. "top" keeps
 * its top edge in place when its content grows or shrinks (a step that adds a
 * form), so the dialog never jumps to re-centre: the top sits where a dialog
 * of about 44rem would be centred, at least 1rem from the edge, and the
 * dialog only grows downwards (scrolling inside once it reaches 1rem from the
 * bottom).
 */

export type ModalSize = "sm" | "md" | "lg";

export type ModalAnchor = "center" | "top";

type ContentProps = ComponentPropsWithoutRef<typeof Dialog.Content>;

export interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the modal (rendered with Radix asChild). */
  trigger?: ReactNode;
  /** sm 26rem, md 32rem (default), lg 44rem; never wider than the viewport minus 2rem. */
  size?: ModalSize;
  /** "center" (default) or "top": keeps the top edge still while the content changes height. */
  anchor?: ModalAnchor;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  hideDescription?: boolean;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  /** Accessible name of the close button. Default site.ui.close ("Close"). */
  closeLabel?: string;
  padded?: boolean;
  /** "dark" renders on deep. */
  tone?: "light" | "dark";
  className?: string;
  bodyClassName?: string;
  onOpenAutoFocus?: ContentProps["onOpenAutoFocus"];
  onCloseAutoFocus?: ContentProps["onCloseAutoFocus"];
  children?: ReactNode;
}

const widths: Record<ModalSize, string> = {
  sm: "max-w-[26rem]",
  md: "max-w-[32rem]",
  lg: "max-w-[44rem]",
};

/** Vertical placement. Horizontal centring (mx-auto) is shared. */
const anchors: Record<ModalAnchor, string> = {
  center: "my-auto max-h-[calc(100dvh-2rem)]",
  top: "mt-[max(1rem,calc(50dvh-22rem))] mb-auto max-h-[calc(100dvh-max(1rem,calc(50dvh-22rem))-1rem)]",
};

export function Modal({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  size = "md",
  anchor = "center",
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
}: ModalProps) {
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
            "fixed inset-0 z-60 mx-auto flex h-fit w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-card shadow-lift outline-none",
            "motion-safe:data-[state=open]:animate-[corvane-modal-in_320ms_cubic-bezier(0.32,0.72,0,1)] motion-safe:data-[state=closed]:animate-[corvane-modal-out_200ms_ease-in]",
            dark ? "focus-on-dark bg-deep text-fog" : "bg-fog text-ink",
            widths[size],
            anchors[anchor],
            className,
          )}
        >
          <div className={cn("flex shrink-0 items-start gap-3 px-5 pt-5 md:px-7 md:pt-6", hideTitle && !headerExtra && "absolute top-0 right-0 z-10")}>
            <div className="flex min-w-0 flex-1 items-center gap-3 pt-1.5">
              <Dialog.Title className={cn(hideTitle ? "sr-only" : "text-[1.625rem] leading-tight md:text-[1.875rem]")}>
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
                className="-mt-1 -mr-3"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </Button>
            </Dialog.Close>
          </div>

          {description ? (
            <Dialog.Description
              className={cn(
                hideDescription ? "sr-only" : "px-5 pt-2 text-[0.9375rem] leading-relaxed md:px-7",
                dark ? "text-mist" : "text-ink-soft",
              )}
            >
              {description}
            </Dialog.Description>
          ) : null}

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              padded && "px-5 pt-5 pb-6 md:px-7 md:pb-7",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer ? (
            <div
              className={cn(
                "shrink-0 border-t px-5 py-4 md:px-7",
                dark ? "border-line-on-deep" : "border-line",
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
