import { pages } from "@/content/pages";

/**
 * POST /api/contact
 * Body: { name: string, email: string, orderNumber?: string | null, message: string }
 * 200:  { ok: true }
 * 400:  { ok: false, error: "invalid_request", fields: { name?, email?, orderNumber?, message? } }
 *       with one ContactFieldError per field that failed, or { ok: false, error: "invalid_request" }
 *       for a body that is not a JSON object
 *
 * STUB: the message is validated and then dropped. Nothing is stored, logged
 * or sent. A real helpdesk (e.g. a ticketing tool's API, called server side
 * with a secret key from the environment) connects here at launch, keeping
 * the same response shape so components/contact/ContactForm.tsx needs no
 * changes. Add rate limiting and spam protection at that point too.
 */

export type ContactField = "name" | "email" | "orderNumber" | "message";

export type ContactFieldError = "required" | "invalid" | "too_long";

const limits = pages.contact.limits;

/** Practical maximum length of an email address (RFC 5321 path limit). */
const MAX_EMAIL_LENGTH = 254;

/**
 * The HTML spec's pattern for type="email" (what the browser checks), with one
 * stricter rule: the domain needs at least one dot. Same as /api/subscribe.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });

  const fields: Partial<Record<ContactField, ContactFieldError>> = {};

  const name = text(body.name);
  if (!name) fields.name = "required";
  else if (name.length > limits.name) fields.name = "too_long";

  const email = text(body.email);
  if (!email) fields.email = "required";
  else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) fields.email = "invalid";

  // Optional: a missing, null or empty order number is fine.
  if (body.orderNumber !== undefined && body.orderNumber !== null) {
    const orderNumber = text(body.orderNumber);
    if (orderNumber === null) fields.orderNumber = "invalid";
    else if (orderNumber.length > limits.orderNumber) fields.orderNumber = "too_long";
  }

  const message = text(body.message);
  if (!message) fields.message = "required";
  else if (message.length > limits.message) fields.message = "too_long";

  if (Object.keys(fields).length > 0) {
    return Response.json({ ok: false, error: "invalid_request", fields }, { status: 400 });
  }

  // A real helpdesk call goes here. The stub keeps nothing.
  return Response.json({ ok: true });
}
