"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

import { markSubscribed } from "./state";

/**
 * Email step of the email capture (brief §2.8, docs/PLAN.md §10.5-6). For the
 * light (fog) modal; the footer has its own form for deep (NewsletterForm).
 *
 * - Visible label, type="email" field and a submit button that names the
 *   action ("Show my code": the code appears on screen, nothing is emailed).
 *   The consent text sits under the field and is linked to it with
 *   aria-describedby: what people sign up for (CORVANE emails about product
 *   news, new scents and offers), that they can unsubscribe any time, and a
 *   link to the Privacy Policy. No checkbox. While /api/subscribe is a stub,
 *   `demoNote` follows: nothing is saved or sent.
 * - Phones stack field, message and button, so an error sits right under the
 *   field it is about; from sm the button sits beside the field and the
 *   message under both.
 * - POST /api/subscribe { email, source: "popup" }. 200 -> track("sign_up",
 *   { method: "popup" }), storageKeys.emailCaptureSubscribed is set and
 *   `onSuccess` shows the code; 400 -> invalid-email message; anything else
 *   -> a generic error. Messages go to one polite live region; an invalid
 *   address also moves focus back to the field.
 * - While sending, the button stays focusable (aria-disabled) and repeat
 *   submits are ignored.
 */

type Status = "idle" | "submitting" | "error";

type FormError = "invalid-email" | "failed";

export interface EmailCaptureFormProps {
  onSuccess: () => void;
  /** Called when the Privacy Policy link is followed (the modal closes for the navigation). */
  onNavigate?: () => void;
  className?: string;
}

function isOkResponse(value: unknown): boolean {
  return typeof value === "object" && value !== null && (value as { ok?: unknown }).ok === true;
}

export function EmailCaptureForm({ onSuccess, onNavigate, className }: EmailCaptureFormProps) {
  const copy = site.emailCapture;
  const { privacy } = copy.consent;
  const id = useId();
  const inputId = `${id}-email`;
  const consentId = `${id}-consent`;
  const messageId = `${id}-message`;
  const demoId = `${id}-demo`;

  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<FormError | null>(null);

  const submitting = status === "submitting";
  const invalid = status === "error" && error === "invalid-email";

  function fail(kind: FormError) {
    setStatus("error");
    setError(kind);
    if (kind === "invalid-email") inputRef.current?.focus();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (status === "error") {
      setStatus("idle");
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const input = inputRef.current;
    const value = email.trim();
    if (!input || value === "" || !input.validity.valid) {
      fail("invalid-email");
      return;
    }

    setStatus("submitting");
    setError(null);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "popup" }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok && isOkResponse(data)) {
        track("sign_up", { method: "popup" });
        markSubscribed();
        onSuccess();
        return;
      }
      fail(response.status === 400 ? "invalid-email" : "failed");
    } catch {
      fail("failed");
    }
  }

  const message = status === "error" ? (error === "invalid-email" ? copy.invalidEmail : copy.error) : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-busy={submitting || undefined}
      className={cn("motion-safe:animate-[corvane-fade-in_320ms_ease-out]", className)}
    >
      <label htmlFor={inputId} className="label-caps block text-ink-soft">
        {copy.emailLabel}
      </label>

      {/*
        One wrapping row: field and button side by side from sm, the message on
        its own line below them (order-last). Below sm it is a column in DOM
        order: field, message, button. Margins instead of gap, so the empty
        live region adds no space.
      */}
      <div className="mt-2.5 flex flex-col sm:flex-row sm:flex-wrap">
        <input
          ref={inputRef}
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={handleChange}
          aria-invalid={invalid || undefined}
          aria-describedby={cn(messageId, consentId, copy.demoNote && demoId)}
          // ink/55 on fog is about 3.6:1 (WCAG 1.4.11); a real border, so it also shows in forced colors.
          className={cn(
            "h-12 w-full min-w-0 rounded-full border bg-white px-5 text-base text-ink sm:w-0 sm:flex-1 sm:text-[15px]",
            "transition-colors duration-200 placeholder:text-ink-soft",
            invalid ? "border-signal" : "border-ink/55 hover:border-ink/80",
          )}
        />

        {/* Always in the DOM so changes are announced. No height while empty. */}
        <p
          id={messageId}
          aria-live="polite"
          className={cn(
            "flex items-start gap-2 text-sm leading-5 font-medium text-ink sm:order-last sm:basis-full",
            message && "mt-2.5 sm:mt-3",
          )}
        >
          {message ? <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-signal" strokeWidth={2.25} /> : null}
          {message}
          {submitting ? <span className="sr-only">{copy.submitting}</span> : null}
        </p>

        <Button
          type="submit"
          variant="primary"
          aria-disabled={submitting || undefined}
          iconStart={
            submitting ? (
              <LoaderCircle aria-hidden="true" className="size-[1.1em] motion-safe:animate-spin" strokeWidth={2.25} />
            ) : undefined
          }
          className={cn("mt-2.5 w-full sm:mt-0 sm:ml-2.5 sm:w-auto sm:min-w-[9.5rem]", submitting && "cursor-progress")}
        >
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>

      <p id={consentId} className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
        {copy.consent.text} {privacy.before}
        <Link
          href={privacy.href}
          onClick={onNavigate}
          className="font-medium text-ink underline underline-offset-[3px] hover:decoration-2"
        >
          {privacy.linkLabel}
        </Link>
        {privacy.after}
      </p>
      {copy.demoNote ? (
        <p id={demoId} className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-soft">
          {copy.demoNote}
        </p>
      ) : null}
    </form>
  );
}
