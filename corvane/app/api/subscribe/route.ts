/**
 * POST /api/subscribe
 * Body: { email: string, source?: string }   e.g. source "footer" or "email_capture"
 * 200:  { ok: true }
 * 400:  { ok: false, error: "invalid-email" } for a missing, malformed or too long
 *       address, and for a body that is not a JSON object
 *
 * STUB: nothing is stored and nothing is sent. This is where a real email tool
 * (e.g. Klaviyo) connects at launch (docs/TODO-LAUNCH.md): subscribe the
 * address to the newsletter list with `source` as a property, server side with
 * a secret API key from the environment, and keep the same response shape so
 * the footer form and the email capture popup need no changes. The tool must
 * also enforce "first order only" for the welcome code (D09) and handle
 * double opt-in and unsubscribes.
 */

/** Practical maximum length of an email address (RFC 5321 path limit). */
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 64;

/**
 * The HTML spec's pattern for type="email" (what the browser checks before
 * submitting), with one stricter rule: the domain needs at least one dot.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value);
}

function invalidEmail(): Response {
  return Response.json({ ok: false, error: "invalid-email" }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) return invalidEmail();

  const email = typeof body.email === "string" ? body.email.trim() : body.email;
  if (!isValidEmail(email)) return invalidEmail();

  // Kept for the email tool (which form the sign-up came from); ignored by the stub.
  const source =
    typeof body.source === "string" && body.source.length <= MAX_SOURCE_LENGTH ? body.source : "unknown";
  void source;

  return Response.json({ ok: true });
}
