import { shipping } from "@/content/shipping";
import { MAX_CART_LINES, parseCartLine } from "@/lib/catalog";
import { commerce } from "@/lib/commerce";
import type { CartLine, CountryCode } from "@/lib/types";

/**
 * POST /api/checkout
 * Body: { lines: CartLine[], discountCode?: string | null, country?: "NL" | "BE" }
 * 200:  { checkoutUrl: string }
 * 400:  { error: "invalid_request", issues: string[] } for a malformed body or unknown products
 * 502:  { error: "checkout_unavailable" } when the commerce provider fails
 *
 * Validation is deliberately minimal: shape, known products, known country.
 * Prices are never taken from the client; the provider prices the cart itself.
 */

const MAX_CODE_LENGTH = 64;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function badRequest(issues: string[]): Response {
  return Response.json({ error: "invalid_request", issues }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) return badRequest(["Body must be a JSON object."]);

  const issues: string[] = [];
  const products = await commerce.getProducts();

  const rawLines = body.lines;
  const lines: CartLine[] = [];
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    issues.push("lines must be a non-empty array.");
  } else if (rawLines.length > MAX_CART_LINES) {
    issues.push(`lines may hold at most ${MAX_CART_LINES} entries.`);
  } else {
    rawLines.forEach((raw, index) => {
      const line = parseCartLine(raw, products);
      if (line) lines.push(line);
      else issues.push(`lines[${index}] is not a valid cart line.`);
    });
  }

  const rawCode = body.discountCode;
  let discountCode: string | null = null;
  if (typeof rawCode === "string") {
    const trimmed = rawCode.trim();
    if (trimmed.length > MAX_CODE_LENGTH) issues.push("discountCode is too long.");
    else discountCode = trimmed || null;
  } else if (rawCode !== undefined && rawCode !== null) {
    issues.push("discountCode must be a string or null.");
  }

  const rawCountry = body.country ?? shipping.defaultCountry;
  const country = shipping.countries.find((entry) => entry.code === rawCountry)?.code;
  if (!country) issues.push(`country must be one of ${shipping.countries.map((entry) => entry.code).join(", ")}.`);

  if (issues.length > 0 || !country) return badRequest(issues);

  try {
    const result = await commerce.createCheckout({ lines, discountCode, country: country as CountryCode });
    return Response.json({ checkoutUrl: result.checkoutUrl });
  } catch (error) {
    console.error("Checkout failed:", error);
    return Response.json({ error: "checkout_unavailable" }, { status: 502 });
  }
}
