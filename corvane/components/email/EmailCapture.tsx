"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { useCart } from "@/components/cart/CartProvider";
import { Modal } from "@/components/ui/Modal";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

import { EmailCaptureForm } from "./EmailCaptureForm";
import { RewardCards } from "./RewardCards";
import { RewardCode } from "./RewardCode";
import {
  EXIT_INTENT_QUERY,
  bodyBlocksPill,
  canAutoOpen,
  dismissPill,
  isCheckoutPath,
  isDialogOpen,
  isEditingField,
  isPillDismissed,
  markAutoOpened,
  useBodyBlocksPill,
  useMounted,
  usePillDismissed,
  useSubscribed,
} from "./state";

/**
 * Email capture: floating pill and card modal (brief §2.8 and §6.6,
 * docs/PLAN.md §10). Render once in app/layout.tsx, inside CartProvider.
 *
 * Pill (bottom left, fixed, z-45, clear of the safe area):
 * - Always opens the modal. A small close button hides it for the rest of
 *   the visit (sessionStorage) and also stops the popup from opening on its
 *   own in that visit.
 * - Appears once the visitor has scrolled the current page by
 *   PILL_REVEAL_SCROLL_Y, or after the modal was open on it, so the first
 *   view of a page (hero, product name, the first cards) is never covered
 *   (D51). It then stays for that page.
 * - Hidden on /checkout, on product pages below lg (the mobile sticky
 *   add-to-cart owns the bottom edge there, and the pill would sit over the
 *   buy box), while the mobile sticky add-to-cart is visible
 *   (body[data-sticky-atc="true"]) and while a consent banner is open
 *   (body[data-consent-open="true"]), watched with a MutationObserver. So it
 *   never overlaps either of them.
 *
 * Auto-open, at most once per page load:
 * - After site.emailCapture.delayMs (8 s), or on desktop exit intent (a fine
 *   pointer leaving the top of the window).
 * - Only when storage works (test write), the visitor has not signed up and
 *   the last auto-open is missing or at least cooldownDays (7) old. The
 *   timestamp is stored at the moment it opens; if that write fails, it does
 *   not open.
 * - Never on /checkout, never while the cart drawer or another dialog is open,
 *   the sticky add-to-cart or a consent banner shows, the visitor is typing
 *   in a field, the pill was hidden, or the visitor already opened it.
 *
 * Modal (components/ui/Modal: focus trap, Esc, focus returns): the same
 * reward is stated before a card is turned, with its conditions. Turn a card
 * (RewardCards), leave an email (EmailCaptureForm), get the code (RewardCode).
 * "No thanks" is a plain text button; there is no confirm-shaming copy.
 */

type Step = "cards" | "code";

/** Scroll distance (px) after which the pill appears on a page. */
const PILL_REVEAL_SCROLL_Y = 240;

/** Product pages: no pill below lg, where the sticky add-to-cart and the buy box sit. */
function isProductPath(pathname: string | null): boolean {
  return pathname?.startsWith("/products/") ?? false;
}

/** Hoisted keyframes for the pill (React dedupes by href). */
function PillMotion() {
  return (
    <style href="corvane-email-capture-motion" precedence="default">
      {"@keyframes corvane-pill-in{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}"}
    </style>
  );
}

/** Two small cards, the front one with the vane: the card backs in miniature. */
function PillCards() {
  return (
    <span aria-hidden="true" className="relative block h-7 w-7 shrink-0">
      <span className="absolute top-[4px] left-[1px] h-[20px] w-[15px] -rotate-[14deg] rounded-[3px] border border-deep/50 bg-sand" />
      <span className="absolute top-[2px] right-[2px] flex h-[22px] w-[16px] rotate-[6deg] items-center justify-center rounded-[3px] bg-deep text-fog shadow-[0_1px_2px_rgb(16_20_24/0.25)]">
        <VaneIcon className="size-[13px]" />
      </span>
    </span>
  );
}

interface EmailPillProps {
  subscribed: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  className?: string;
}

function EmailPill({ subscribed, onOpen, onDismiss, className }: EmailPillProps) {
  const copy = site.emailCapture;
  return (
    <div
      data-email-pill
      className={cn(
        "fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))] z-45",
        "lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:left-[calc(1.5rem+env(safe-area-inset-left,0px))]",
        "motion-safe:animate-[corvane-pill-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] print:hidden",
        className,
      )}
    >
      <PillMotion />
      <div className="flex items-center rounded-full border border-line bg-fog text-ink shadow-lift">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="flex h-11 items-center gap-2 rounded-full pr-3.5 pl-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors hover:bg-ink/[0.05] focus-visible:outline-offset-[-3px]"
        >
          <PillCards />
          <span>{subscribed ? copy.pillSubscribedLabel : copy.pillLabel}</span>
          {subscribed ? null : <span className="sr-only"> {copy.pillLabelSuffix}</span>}
        </button>
        <span aria-hidden="true" className="h-5 w-px bg-line" />
        <button
          type="button"
          onClick={onDismiss}
          aria-label={copy.pillDismiss}
          className="flex size-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-offset-[-3px]"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function EmailCapture() {
  const copy = site.emailCapture;
  const pathname = usePathname();
  const { isOpen: cartOpen } = useCart();

  const mounted = useMounted();
  const dismissed = usePillDismissed();
  const bodyBlocked = useBodyBlocksPill();
  const subscribed = useSubscribed();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("cards");
  const [chosen, setChosen] = useState<number | null>(null);
  const [focusCode, setFocusCode] = useState(false);
  /** The page (pathname) on which the pill has appeared; it resets with every route change. */
  const [revealedOn, setRevealedOn] = useState<string | null>(null);
  const revealed = revealedOn === pathname;

  /** Set once the visitor opens the modal themselves; the popup then never opens on its own. */
  const openedByVisitor = useRef(false);
  /** True while the current opening is an auto-open (timer or exit intent), not a click on the pill. */
  const openedAutomatically = useRef(false);

  /** Opens the modal at its first step (or at the code, after signing up). */
  function show(signedUp: boolean, automatic = false) {
    openedAutomatically.current = automatic;
    setStep(signedUp ? "code" : "cards");
    setChosen(null);
    setFocusCode(false);
    setOpen(true);
  }

  // Reveal the pill once this page has been scrolled. Checked once after mount
  // as well, for a page that opens scrolled (an anchor, scroll restoration).
  useEffect(() => {
    if (revealed) return;
    function check() {
      if (window.scrollY >= PILL_REVEAL_SCROLL_Y) setRevealedOn(pathname);
    }
    const frame = requestAnimationFrame(check);
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check);
    };
  }, [pathname, revealed]);

  // Latest values for the timer and the exit-intent listener, without re-arming them.
  const isCartOpen = useEffectEvent(() => cartOpen);
  const openAutomatically = useEffectEvent(() => show(false, true));

  // Auto-open: one timer and one exit-intent listener per page load.
  useEffect(() => {
    if (!site.emailCapture.enabled || !canAutoOpen(Date.now())) return;

    let finished = false;

    function finish() {
      finished = true;
      clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    }

    function blockedNow(): boolean {
      return (
        isCartOpen() ||
        isCheckoutPath(window.location.pathname) ||
        bodyBlocksPill() ||
        isDialogOpen() ||
        isEditingField()
      );
    }

    function attempt() {
      if (finished) return;
      // The visitor already opened it, or hid the pill: never push it at them.
      if (openedByVisitor.current || isPillDismissed()) {
        finish();
        return;
      }
      if (blockedNow()) return;
      const now = Date.now();
      // Re-check (another tab may have shown it); the timestamp write doubles as the storage test.
      if (!canAutoOpen(now) || !markAutoOpened(now)) {
        finish();
        return;
      }
      finish();
      openAutomatically();
    }

    function onMouseOut(event: MouseEvent) {
      if (event.relatedTarget === null && event.clientY <= 0) attempt();
    }

    const timer = setTimeout(attempt, site.emailCapture.delayMs);
    if (window.matchMedia(EXIT_INTENT_QUERY).matches) document.addEventListener("mouseout", onMouseOut);
    return finish;
  }, []);

  if (!copy.enabled) return null;

  const onCheckout = isCheckoutPath(pathname);
  const showPill = mounted && revealed && !dismissed && !bodyBlocked && !onCheckout;

  function openFromPill() {
    openedByVisitor.current = true;
    show(subscribed);
  }

  /** Closing (any way) also reveals the pill, so the code stays one click away. */
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setRevealedOn(pathname);
  }

  function close() {
    handleOpenChange(false);
  }

  /**
   * An auto-open did not come from anything the visitor did, so focus goes to
   * the dialog itself (it is announced with its title and description) rather
   * than to Close, which would show a focus ring nobody asked for. Tab then
   * starts at Close as usual. Opened from the pill, Radix focuses Close.
   */
  function handleOpenAutoFocus(event: Event) {
    if (!openedAutomatically.current) return;
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus({ preventScroll: true });
  }

  function handleSignedUp() {
    setFocusCode(true);
    setStep("code");
  }

  const onCode = step === "code";

  return (
    <>
      {showPill ? (
        <EmailPill
          subscribed={subscribed}
          onOpen={openFromPill}
          onDismiss={dismissPill}
          className={isProductPath(pathname) ? "max-lg:hidden" : undefined}
        />
      ) : null}

      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        size="md"
        title={onCode ? copy.successHeading : copy.title}
        description={
          onCode ? (
            copy.successLine(copy.rewardCode)
          ) : (
            <>
              <span className="block font-medium text-ink">{copy.sameRewardNote}</span>
              <span className="mt-1 block text-[0.8125rem]">{copy.rewardConditions}</span>
            </>
          )
        }
        closeLabel={copy.close}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        {onCode ? (
          <RewardCode focusOnMount={focusCode} onDone={close} />
        ) : (
          <>
            <div className="rounded-card bg-sand px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
              <RewardCards chosen={chosen} onChoose={setChosen} />
            </div>

            <p aria-live="polite" className="mt-4 text-[0.9375rem] leading-6 text-ink">
              {chosen === null ? copy.intro : copy.revealedLine(copy.rewardLabel)}
            </p>

            {chosen !== null ? <EmailCaptureForm className="mt-4" onSuccess={handleSignedUp} onNavigate={close} /> : null}

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={close}
                className="h-11 rounded-full px-4 text-[0.9375rem] font-medium text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
              >
                {copy.dismiss}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
