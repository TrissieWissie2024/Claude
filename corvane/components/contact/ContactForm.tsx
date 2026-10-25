"use client";

import { Check, CircleAlert, Info, LoaderCircle } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { pages } from "@/content/pages";
import { cn } from "@/lib/cn";

/**
 * Contact form (brief §6 "Contact (formulier als stub)", docs/PLAN.md §1).
 *
 * - Fields: name, email, order number (optional, with a hint) and message, all
 *   with visible labels. type="email" and autocomplete for the keyboard and
 *   autofill; noValidate replaces the browser bubbles with our own messages.
 * - Validation on submit: every problem shows under its field (aria-invalid,
 *   aria-describedby) and focus moves to the first one. After a failed submit,
 *   messages update as the visitor types.
 * - POST /api/contact (a stub that validates and drops the message; nothing is
 *   stored or sent). 200 -> the success panel, which says plainly that the
 *   form is a demo; 400 with field errors -> the same inline messages;
 *   anything else -> a general error. The demo notice sits above the form.
 * - While sending, the button stays focusable (aria-disabled), repeat submits
 *   are ignored. Results are announced through a polite live region; the
 *   success heading takes focus.
 *
 * Also exports the small field helpers (FormField, fieldControlClasses,
 * describedBy, isValidEmail) that the demo checkout uses, so both forms look
 * and behave the same.
 */

/* ------------------------------------------------------------------ */
/* Field helpers (shared with components/checkout/CheckoutView.tsx)    */
/* ------------------------------------------------------------------ */

/**
 * Same rule as the API stubs: the HTML type="email" pattern, plus a dot in the
 * domain. The server checks again.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/** ids of a field's hint and error, for aria-describedby. */
export function describedBy(id: string, { hint, error }: { hint?: ReactNode; error?: ReactNode }): string | undefined {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/**
 * Text input, select and textarea on light surfaces. White field, ink/55
 * border (about 3.6:1 on fog, WCAG 1.4.11; a real border, so it shows in forced
 * colors), signal border when invalid. 16 px text on phones, so iOS does not zoom.
 */
export function fieldControlClasses(invalid: boolean, kind: "input" | "select" | "textarea" = "input"): string {
  return cn(
    "w-full min-w-0 rounded-xl border bg-white text-base text-ink transition-colors duration-200 md:text-[15px]",
    "placeholder:text-ink-soft disabled:cursor-not-allowed disabled:opacity-60",
    kind === "textarea" ? "min-h-40 resize-y px-4 py-3 leading-relaxed" : "h-12 px-4",
    kind === "select" && "appearance-none pr-11",
    invalid ? "border-signal" : "border-ink/55 hover:border-ink/80",
  );
}

export interface FormFieldProps {
  /** id of the control; the label points to it. */
  id: string;
  label: ReactNode;
  /** e.g. "(optional)", shown after the label. */
  optional?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  /** The control. Give it id, aria-invalid and aria-describedby={describedBy(id, { hint, error })}. */
  children: ReactNode;
}

/** Label, control, hint and error message. */
export function FormField({ id, label, optional, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="label-caps flex flex-wrap items-baseline gap-x-1.5 text-ink-soft">
        <span>{label}</span>
        {optional ? <span className="font-sans text-xs font-normal tracking-normal normal-case">{optional}</span> : null}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-[13px] leading-snug text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm leading-5 font-medium text-ink">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2.25} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Quiet notice with an info icon, e.g. "Demo form: messages are not sent anywhere." */
export function DemoNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-xl bg-sand px-4 py-3 text-sm leading-snug font-medium text-ink",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Contact form                                                        */
/* ------------------------------------------------------------------ */

type Field = "name" | "email" | "orderNumber" | "message";

type Values = Record<Field, string>;

type Errors = Partial<Record<Field, string>>;

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY: Values = { name: "", email: "", orderNumber: "", message: "" };

const FIELD_ORDER: Field[] = ["name", "email", "orderNumber", "message"];

const copy = pages.contact.form;
const limits = pages.contact.limits;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.name.trim() === "") errors.name = copy.errors.nameRequired;
  if (!isValidEmail(values.email.trim())) errors.email = copy.errors.emailInvalid;
  if (values.message.trim() === "") errors.message = copy.errors.messageRequired;
  return errors;
}

/** Maps the stub's field errors to our messages; null when one has no message (then the general error shows). */
function errorsFromResponse(data: unknown): Errors | null {
  if (typeof data !== "object" || data === null) return null;
  const fields = (data as { fields?: unknown }).fields;
  if (typeof fields !== "object" || fields === null) return null;
  const messages: Record<Field, string | null> = {
    name: copy.errors.nameRequired,
    email: copy.errors.emailInvalid,
    // The form caps the length, so these only fail when the client and server rules drift.
    orderNumber: null,
    message: copy.errors.messageRequired,
  };
  const errors: Errors = {};
  for (const field of Object.keys(fields) as Field[]) {
    const message = messages[field];
    if (!message) return null;
    errors[field] = message;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const id = useId();
  const ids: Record<Field, string> = {
    name: `${id}-name`,
    email: `${id}-email`,
    orderNumber: `${id}-order`,
    message: `${id}-message`,
  };
  const statusId = `${id}-status`;

  const successRef = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const submitting = status === "submitting";

  function focusFirstError(next: Errors) {
    const first = FIELD_ORDER.find((field) => next[field]);
    if (first) document.getElementById(ids[first])?.focus();
  }

  function handleChange(field: Field) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = { ...values, [field]: event.target.value };
      setValues(next);
      // After a failed submit, messages follow the input; before that, typing shows none.
      if (attempted) setErrors(validate(next));
      if (status === "error") setStatus("idle");
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setAttempted(true);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          orderNumber: values.orderNumber.trim() || null,
          message: values.message.trim(),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok && typeof data === "object" && data !== null && (data as { ok?: unknown }).ok === true) {
        setStatus("success");
        setValues(EMPTY);
        setErrors({});
        setAttempted(false);
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }
      const fieldErrors = response.status === 400 ? errorsFromResponse(data) : null;
      if (fieldErrors) {
        setErrors(fieldErrors);
        setStatus("idle");
        focusFirstError(fieldErrors);
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    requestAnimationFrame(() => document.getElementById(ids.name)?.focus());
  }

  if (status === "success") {
    return (
      <div className={cn("rounded-card bg-white p-6 ring-1 ring-line ring-inset md:p-8", className)}>
        <div role="status" aria-live="polite">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-sand text-ink">
            <Check className="size-5" strokeWidth={2} />
          </span>
          <h2 ref={successRef} tabIndex={-1} className="mt-5 text-[1.625rem] leading-tight text-ink md:text-[1.875rem]">
            {copy.success.heading}
          </h2>
          <p className="mt-3 max-w-[34rem] text-base leading-relaxed text-ink-soft">{copy.success.body}</p>
        </div>
        <Button variant="outline" className="mt-7" onClick={reset}>
          {copy.sendAnother}
        </Button>
      </div>
    );
  }

  const field = (name: Field, hint?: string) => ({
    id: ids[name],
    name,
    value: values[name],
    onChange: handleChange(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": describedBy(ids[name], { hint, error: errors[name] }),
  });

  return (
    <form
      noValidate
      aria-label={copy.label}
      aria-busy={submitting || undefined}
      onSubmit={handleSubmit}
      className={cn("rounded-card bg-white p-5 ring-1 ring-line ring-inset sm:p-6 md:p-8", className)}
    >
      <DemoNotice>{pages.contact.demoNotice}</DemoNotice>

      <div className="mt-6 grid gap-6 md:mt-7 md:grid-cols-2 md:gap-x-5">
        <FormField id={ids.name} label={copy.name.label} error={errors.name}>
          <input
            {...field("name")}
            type="text"
            required
            autoComplete={copy.name.autoComplete}
            maxLength={limits.name}
            className={fieldControlClasses(Boolean(errors.name))}
          />
        </FormField>

        <FormField id={ids.email} label={copy.email.label} error={errors.email}>
          <input
            {...field("email")}
            type="email"
            required
            inputMode="email"
            autoComplete={copy.email.autoComplete}
            spellCheck={false}
            placeholder={copy.email.placeholder}
            maxLength={254}
            className={fieldControlClasses(Boolean(errors.email))}
          />
        </FormField>

        <FormField
          id={ids.orderNumber}
          label={copy.orderNumber.label}
          optional={copy.orderNumber.optional}
          hint={copy.orderNumber.hint}
          className="md:col-span-2"
        >
          <input
            {...field("orderNumber", copy.orderNumber.hint)}
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={limits.orderNumber}
            className={cn(fieldControlClasses(false), "md:max-w-[calc(50%-0.625rem)]")}
          />
        </FormField>

        <FormField id={ids.message} label={copy.message.label} error={errors.message} className="md:col-span-2">
          <textarea
            {...field("message")}
            required
            rows={6}
            maxLength={limits.message}
            className={fieldControlClasses(Boolean(errors.message), "textarea")}
          />
        </FormField>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mt-8">
        <Button
          type="submit"
          variant="primary"
          size="md"
          aria-disabled={submitting || undefined}
          aria-describedby={statusId}
          iconStart={
            submitting ? (
              <LoaderCircle aria-hidden="true" className="size-[1.1em] motion-safe:animate-spin" strokeWidth={2.25} />
            ) : undefined
          }
          className={cn("w-full sm:w-auto sm:min-w-[11rem]", submitting && "cursor-progress")}
        >
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>

      {/* Always in the DOM so changes are announced. No height while empty. */}
      <p
        id={statusId}
        aria-live="polite"
        className={cn("flex items-start gap-2 text-sm leading-5 font-medium text-ink", status === "error" && "mt-4")}
      >
        {status === "error" ? (
          <>
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2.25} />
            {copy.error}
          </>
        ) : null}
        {submitting ? <span className="sr-only">{copy.submitting}</span> : null}
      </p>
    </form>
  );
}
