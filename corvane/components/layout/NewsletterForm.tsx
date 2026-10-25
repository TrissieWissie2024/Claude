"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { markSubscribed } from "@/components/email/state";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/**
 * Footer newsletter sign-up (brief §2.8, §6.12; docs/PLAN.md §10.7). For deep
 * surfaces; place it inside a `focus-on-dark` ancestor (the Footer is one).
 *
 * - Visible label, email field and submit. The consent text sits right under
 *   the field and is linked to it with aria-describedby: what people sign up
 *   for, that they can unsubscribe any time, and a link to the Privacy Policy.
 *   There is no checkbox.
 * - Validation: type="email" + required for semantics and the mobile keyboard,
 *   checked by the browser's own rules on submit; noValidate replaces the
 *   native bubble with our message, so it is styled and announced.
 * - While /api/subscribe is a stub, `demoNote` under the consent text says
 *   that nothing is saved or sent, and the success line says the same.
 * - POST /api/subscribe { email, source }. 200 -> success: fires
 *   track("sign_up", { method: "newsletter" }), records the sign-up on this
 *   device (markSubscribed, so the sign-up window never opens on its own
 *   again and its pill offers the code) and clears the field. The success
 *   line also gives the welcome code, so nobody has to sign up twice.
 *   400 invalid-email -> invalid message; anything else -> generic error.
 * - States idle / submitting / success / error. Messages go to one polite
 *   live region. While submitting the button stays focusable (aria-disabled,
 *   not disabled), so keyboard focus is never lost; repeat submits are ignored.
 */

type Status = "idle" | "submitting" | "success" | "error";

type FormError = "invalid-email" | "failed";

export interface NewsletterFormProps {
  /** Sent to /api/subscribe as `source`. Default "footer". */
  source?: string;
  className?: string;
}

function isOkResponse(value: unknown): boolean {
  return typeof value === "object" && value !== null && (value as { ok?: unknown }).ok === true;
}

export function NewsletterForm({ source = "footer", className }: NewsletterFormProps) {
  const copy = site.newsletter;
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
    // Typing again clears the last result; a request in flight keeps its state.
    if (status === "error" || status === "success") {
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
        body: JSON.stringify({ email: value, source }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok && isOkResponse(data)) {
        setStatus("success");
        setEmail("");
        track("sign_up", { method: "newsletter" });
        markSubscribed();
        return;
      }
      fail(response.status === 400 ? "invalid-email" : "failed");
    } catch {
      fail("failed");
    }
  }

  let message: ReactNode = null;
  if (status === "success") {
    const code = site.emailCapture.rewardCode;
    const codeLine = copy.successCode(code, site.emailCapture.rewardLabel);
    const [before, after] = codeLine.split(code);
    message = (
      <span className="min-w-0">
        {copy.success}
        <span className="mt-1 block">
          {after === undefined ? (
            codeLine
          ) : (
            <>
              {before}
              <strong className="font-semibold tracking-[0.04em]">{code}</strong>
              {after}
            </>
          )}
        </span>
      </span>
    );
  } else if (status === "error") message = error === "invalid-email" ? copy.invalidEmail : copy.error;

  // The success line says the same as the demo note, so the note steps aside meanwhile.
  const showDemoNote = Boolean(copy.demoNote) && status !== "success";

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={submitting || undefined} className={cn("w-full", className)}>
      <label htmlFor={inputId} className="label-caps block text-mist">
        {copy.emailLabel}
      </label>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          spellCheck={false}
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={handleChange}
          aria-invalid={invalid || undefined}
          aria-describedby={cn(messageId, consentId, showDemoNote && demoId)}
          // A real border (fog/45 is about 4:1 on deep, WCAG 1.4.11), not a box-shadow ring, so the field also shows in forced colors.
          className={cn(
            "h-12 w-0 min-w-0 flex-1 rounded-full border bg-fog/[0.06] px-5 text-[15px] text-fog",
            "transition-[border-color,background-color] duration-200 placeholder:text-mist",
            "hover:bg-fog/[0.09] focus-visible:bg-fog/[0.09]",
            invalid ? "border-signal" : "border-fog/45 hover:border-fog/70",
          )}
        />
        <Button
          type="submit"
          variant="primary"
          aria-disabled={submitting || undefined}
          iconStart={
            submitting ? (
              <LoaderCircle aria-hidden="true" className="size-[1.1em] motion-safe:animate-spin" strokeWidth={2.25} />
            ) : undefined
          }
          className={cn("min-w-[7.5rem] px-5 md:min-w-[8.5rem]", submitting && "cursor-progress")}
        >
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>

      {/* Always in the DOM so additions are announced. No visible height while idle or submitting. */}
      <p
        id={messageId}
        aria-live="polite"
        className={cn("flex items-start gap-2 text-sm leading-5 text-fog", message && "mt-3")}
      >
        {status === "success" ? (
          <Check aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={2.25} />
        ) : null}
        {status === "error" ? (
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-signal" strokeWidth={2.25} />
        ) : null}
        {message}
        {submitting ? <span className="sr-only">{copy.submitting}</span> : null}
      </p>

      <p id={consentId} className="mt-4 max-w-[34rem] text-[13px] leading-relaxed text-mist">
        {copy.consent.text} {privacy.before}
        <Link href={privacy.href} className="text-fog underline underline-offset-[3px] hover:decoration-2">
          {privacy.linkLabel}
        </Link>
        {privacy.after}
      </p>
      {showDemoNote ? (
        <p id={demoId} className="mt-2 max-w-[34rem] text-[13px] leading-relaxed text-mist">
          {copy.demoNote}
        </p>
      ) : null}
    </form>
  );
}
