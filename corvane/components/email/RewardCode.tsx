"use client";

import { Check, CircleAlert, Copy, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { cartCopy } from "@/content/cart";
import { offers } from "@/content/offers";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { normalizeDiscountCode } from "@/lib/pricing";

/**
 * Last step of the email capture (docs/PLAN.md §10.6): the welcome code, large,
 * with "Copy code" and "Apply to my cart".
 *
 * - Copy uses navigator.clipboard in try/catch. When the clipboard is blocked
 *   the code is selected instead and a visible line says so; the code box is
 *   also `select-all`, so one tap selects it for a manual copy.
 * - Apply calls useCart().applyDiscountCode(code) and reports the result in a
 *   polite live region: applied, applied but nothing to take it off yet (an
 *   empty cart or gift cards only), or the cart's own error text. One code
 *   per order: when the cart already holds another code, a note says so
 *   before the visitor applies this one, and the result names the code it replaced.
 * - `focusOnMount` moves focus to this panel (used right after signing up,
 *   when the form that had focus goes away). Not when the dialog opens on
 *   this step: Radix places the first focus then.
 */

type CopyState = "idle" | "copied" | "failed";

type ApplyResult = { ok: true; replaced: string | null } | { ok: false; message: string };

export interface RewardCodeProps {
  focusOnMount?: boolean;
  /** "Continue shopping": closes the dialog. */
  onDone: () => void;
}

function labelOf(code: string): string | null {
  const wanted = normalizeDiscountCode(code);
  return offers.discountCodes.find((entry) => normalizeDiscountCode(entry.code) === wanted)?.label ?? null;
}

export function RewardCode({ focusOnMount = false, onDone }: RewardCodeProps) {
  const copy = site.emailCapture;
  const code = copy.rewardCode;
  const normalized = normalizeDiscountCode(code);
  const { hydrated, discountCode, pricing, applyDiscountCode } = useCart();

  const rootRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLParagraphElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

  useEffect(() => {
    if (focusOnMount) rootRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const inCart = hydrated && discountCode === normalized;
  const otherCode = hydrated && discountCode !== null && discountCode !== normalized ? discountCode : null;
  const otherLabel = otherCode ? labelOf(otherCode) : null;

  function selectCode() {
    const element = codeRef.current;
    const selection = window.getSelection();
    if (!element || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function handleCopy() {
    clearTimeout(copyTimer.current);
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      selectCode();
      setCopyState("failed");
      return;
    }
    setCopyState("copied");
    copyTimer.current = setTimeout(() => setCopyState("idle"), 3000);
  }

  function handleApply() {
    const previous = otherCode;
    const result = applyDiscountCode(code);
    setApplyResult(
      result.ok ? { ok: true, replaced: previous } : { ok: false, message: cartCopy.discount.errors[result.error] },
    );
  }

  let applyMessage: string | null = null;
  if (applyResult?.ok === false) applyMessage = applyResult.message;
  else if (applyResult?.ok && inCart) {
    if (pricing.discountError === "nothing-eligible") applyMessage = copy.appliedNothingEligible(code);
    else if (applyResult.replaced) applyMessage = copy.replaced(code, applyResult.replaced);
    else applyMessage = copy.applied(code);
  }

  const copyMessage =
    copyState === "copied" ? copy.copiedMessage(code) : copyState === "failed" ? copy.copyFailed : null;

  return (
    <div ref={rootRef} tabIndex={-1} className="outline-none">
      <div className="rounded-card border border-dashed border-ink/30 bg-sand px-5 py-6 text-center sm:py-7">
        <p className="sr-only">{copy.codeLabel}</p>
        <p
          ref={codeRef}
          data-reward-code
          className="font-sans text-[2rem] leading-none font-semibold tracking-[0.12em] text-ink select-all sm:text-[2.5rem]"
        >
          {code}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Button
          variant="outline"
          fullWidth
          onClick={handleCopy}
          iconStart={
            copyState === "copied" ? (
              <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
            ) : (
              <Copy aria-hidden="true" className="size-4" strokeWidth={2} />
            )
          }
          className="sm:flex-1"
        >
          {copyState === "copied" ? copy.copied : copy.copy}
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={handleApply}
          iconStart={
            inCart && applyResult?.ok !== false ? (
              <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
            ) : (
              <ShoppingBag aria-hidden="true" className="size-4" strokeWidth={2} />
            )
          }
          className="sm:flex-1"
        >
          {inCart ? copy.appliedToCart : copy.applyToCart}
        </Button>
      </div>

      {otherCode && !applyResult ? (
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
          {copy.replaceNote(otherCode, otherLabel ?? otherCode, code)}
        </p>
      ) : null}

      {/* Live regions stay in the DOM; they take no space while empty. */}
      <p aria-live="polite" className={cn("flex items-start gap-2 text-sm leading-5 text-ink", copyMessage && "mt-3")}>
        {copyState === "failed" ? (
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-ink-soft" strokeWidth={2.25} />
        ) : null}
        {copyMessage}
      </p>
      <p
        aria-live="polite"
        className={cn("flex items-start gap-2 text-sm leading-5 font-medium text-ink", applyMessage && "mt-3")}
      >
        {applyResult?.ok === false ? (
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-signal" strokeWidth={2.25} />
        ) : applyMessage ? (
          <Check aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={2.25} />
        ) : null}
        {applyMessage}
      </p>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-full px-4 text-[0.9375rem] font-medium text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
        >
          {copy.continueShopping}
        </button>
      </div>
    </div>
  );
}
