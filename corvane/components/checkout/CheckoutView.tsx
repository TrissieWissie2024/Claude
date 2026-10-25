"use client";

import { Check, ChevronDown, CircleAlert } from "lucide-react";
import {
  Fragment,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

import { CartLine, FreePouchLine } from "@/components/cart/CartLine";
import { useCart } from "@/components/cart/CartProvider";
import { getGroupedSetsSaving } from "@/components/cart/CartSummary";
import { DemoNotice, FormField, describedBy, fieldControlClasses, isValidEmail } from "@/components/contact/ContactForm";
import { ArrowRightIcon } from "@/components/home/icons";
import { Button } from "@/components/ui/Button";
import { cartCopy } from "@/content/cart";
import { shipping as shippingConfig } from "@/content/shipping";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { CountryCode, PricingSummary } from "@/lib/types";

/**
 * Demo checkout (brief §6 "Checkout (stub met besteloverzicht,
 * kortingscodeveld en de melding 'Demo checkout: no payment is taken')",
 * docs/PLAN.md §1). Everything comes from useCart(); nothing is sent anywhere.
 *
 * - Order summary: the lines (read-only CartLine, with "Edit cart" opening the
 *   drawer), the free Travel Pouch gift line, a discount code field
 *   (applyDiscountCode, one message per DiscountError; an applied code shows
 *   with Remove), then Subtotal (with the "grouped into sets" note, D34),
 *   the code, shipping to the chosen country, Total, "Taxes included." and
 *   "You save" with its parts. Rows add up on screen, as in the drawer.
 * - Contact and shipping address fields, labelled, with autocomplete, under a
 *   visually hidden h2 ("Your details"), so the heading outline names the
 *   main task. The country select calls setCountry, so shipping in the
 *   summary updates. Gift cards only: no address needed.
 * - "Place demo order": checks the fields, then shows a demo confirmation
 *   (no network call, no payment, the cart stays as it is). The notice "Demo
 *   checkout: no payment is taken" sits at the top of the page
 *   (app/checkout/page.tsx) and again by the button, where it also says that
 *   nothing entered is stored or sent. Nowhere else: once at the top and
 *   once at the action is enough (D51.5).
 * - Before the cart has loaded from storage, a quiet placeholder of similar
 *   height; an empty cart shows a short empty state with a link to the shop.
 *
 * DOM order is summary first, then the form, so phones read "what you are
 * ordering" before "where it goes"; from lg the form sits on the left and the
 * summary on the right (sticky), and the reading order stays review, then
 * details, then place order.
 *
 * The email pill and popup hide themselves on /checkout (components/email).
 */

const copy = cartCopy.checkout;
const summaryCopy = cartCopy.summary;
const discountCopy = cartCopy.discount;

type AddressField = "email" | "firstName" | "lastName" | "address" | "postalCode" | "city";

type Values = Record<AddressField, string>;

type Errors = Partial<Record<AddressField, string>>;

const EMPTY: Values = { email: "", firstName: "", lastName: "", address: "", postalCode: "", city: "" };

const FIELD_ORDER: AddressField[] = ["email", "firstName", "lastName", "address", "postalCode", "city"];

const labels: Record<AddressField, string> = {
  email: copy.contact.email,
  firstName: copy.shippingAddress.firstName,
  lastName: copy.shippingAddress.lastName,
  address: copy.shippingAddress.address,
  postalCode: copy.shippingAddress.postalCode,
  city: copy.shippingAddress.city,
};

const autoComplete: Record<AddressField, string> = {
  email: "email",
  firstName: "shipping given-name",
  lastName: "shipping family-name",
  address: "shipping address-line1",
  postalCode: "shipping postal-code",
  city: "shipping address-level2",
};

function validate(values: Values, needsAddress: boolean): Errors {
  const errors: Errors = {};
  const email = values.email.trim();
  if (email === "") errors.email = copy.required(labels.email);
  else if (!isValidEmail(email)) errors.email = copy.invalidEmail;
  if (needsAddress) {
    for (const field of ["firstName", "lastName", "address", "postalCode", "city"] as const) {
      if (values[field].trim() === "") errors[field] = copy.required(labels[field]);
    }
  }
  return errors;
}

function countryName(code: CountryCode): string {
  return shippingConfig.countries.find((country) => country.code === code)?.name ?? code;
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

interface PlacedOrder {
  email: string;
  total: number;
}

export function CheckoutView() {
  const { hydrated, lines } = useCart();
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  // Kept here, so "Back to checkout" after the demo confirmation shows the details again.
  const [values, setValues] = useState<Values>(EMPTY);
  const resultRef = useRef<HTMLHeadingElement>(null);

  if (!hydrated) {
    return (
      <div aria-busy="true" className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:gap-x-8">
        <span className="sr-only">{copy.loadingLabel}</span>
        <div aria-hidden="true" className="h-[26rem] rounded-card bg-ink/[0.03] lg:col-span-5 lg:col-start-8 lg:row-start-1" />
        <div aria-hidden="true" className="h-[34rem] rounded-card bg-ink/[0.03] lg:col-span-7 lg:row-start-1" />
      </div>
    );
  }

  if (placed) {
    return (
      <Confirmation
        order={placed}
        headingRef={resultRef}
        onBack={() => {
          setPlaced(null);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (lines.length === 0) return <EmptyCheckout />;

  return (
    <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:items-start lg:gap-x-8 xl:gap-x-12">
      <OrderSummary className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:col-span-5 lg:col-start-8 lg:row-start-1" />
      <CheckoutForm
        className="lg:col-span-7 lg:row-start-1"
        values={values}
        setValues={setValues}
        onPlaced={(order) => {
          setPlaced(order);
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0 });
            resultRef.current?.focus({ preventScroll: true });
          });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

interface CheckoutFormProps {
  values: Values;
  setValues: Dispatch<SetStateAction<Values>>;
  onPlaced: (order: PlacedOrder) => void;
  className?: string;
}

function CheckoutForm({ values, setValues, onPlaced, className }: CheckoutFormProps) {
  const { pricing, country, setCountry } = useCart();
  const id = useId();
  const ids = Object.fromEntries(FIELD_ORDER.map((field) => [field, `${id}-${field}`])) as Record<AddressField, string>;
  const countryId = `${id}-country`;
  const statusId = `${id}-status`;

  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);

  const needsAddress = pricing.shipping.requiresShipping;
  const hasErrors = Object.keys(errors).length > 0;

  function handleChange(field: AddressField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: event.target.value };
      setValues(next);
      if (attempted) setErrors(validate(next, needsAddress));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    const found = validate(values, needsAddress);
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) {
      document.getElementById(ids[first])?.focus();
      return;
    }
    // Demo: no network call and no payment. The cart stays as it is.
    onPlaced({ email: values.email.trim(), total: pricing.total });
  }

  const input = (field: AddressField, extra?: { className?: string; inputMode?: "email" | "text"; type?: string }) => (
    <FormField id={ids[field]} label={labels[field]} error={errors[field]} className={extra?.className}>
      <input
        id={ids[field]}
        name={field}
        type={extra?.type ?? "text"}
        inputMode={extra?.inputMode}
        required
        autoComplete={autoComplete[field]}
        spellCheck={field === "email" ? false : undefined}
        placeholder={field === "email" ? copy.contact.emailPlaceholder : undefined}
        value={values[field]}
        onChange={handleChange(field)}
        maxLength={field === "email" ? 254 : 120}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={describedBy(ids[field], { error: errors[field] })}
        className={fieldControlClasses(Boolean(errors[field]))}
      />
    </FormField>
  );

  return (
    <form noValidate aria-label={copy.formLabel} onSubmit={handleSubmit} className={className}>
      <h2 className="sr-only">{copy.formHeading}</h2>

      <fieldset>
        <legend className="text-[1.5rem] leading-tight font-serif font-semibold tracking-[-0.015em] text-ink md:text-[1.75rem]">
          {copy.contact.heading}
        </legend>
        <div className="mt-5 grid gap-5">{input("email", { type: "email", inputMode: "email" })}</div>
      </fieldset>

      <fieldset className="mt-10 border-t border-line pt-8 md:mt-12 md:pt-10">
        <legend className="float-left w-full text-[1.5rem] leading-tight font-serif font-semibold tracking-[-0.015em] text-ink md:text-[1.75rem]">
          {copy.shippingAddress.heading}
        </legend>
        {needsAddress ? (
          <div className="clear-both grid gap-5 pt-5 sm:grid-cols-2 sm:gap-x-4">
            {input("firstName")}
            {input("lastName")}
            {input("address", { className: "sm:col-span-2" })}
            {input("postalCode")}
            {input("city")}
            <FormField id={countryId} label={copy.shippingAddress.country} className="sm:col-span-2">
              <div className="relative">
                <select
                  id={countryId}
                  name="country"
                  autoComplete="shipping country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value as CountryCode)}
                  className={cn(fieldControlClasses(false, "select"), "cursor-pointer")}
                >
                  {shippingConfig.countries.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-4 size-[18px] -translate-y-1/2 text-ink-soft"
                  strokeWidth={1.75}
                />
              </div>
            </FormField>
          </div>
        ) : (
          <p className="clear-both pt-4 text-base leading-relaxed text-ink-soft">{copy.shippingAddress.giftCardsOnly}</p>
        )}
      </fieldset>

      <div className="mt-10 border-t border-line pt-8 md:mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-base font-semibold text-ink">{summaryCopy.total}</p>
          <p className="tabular text-xl font-semibold text-ink">{formatMoney(pricing.total)}</p>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth aria-describedby={statusId} className="mt-5">
          {copy.placeOrder}
        </Button>

        <p
          id={statusId}
          aria-live="polite"
          className={cn("flex items-start gap-2 text-sm leading-5 font-medium text-ink", attempted && hasErrors && "mt-3")}
        >
          {attempted && hasErrors ? (
            <>
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2.25} />
              {copy.fixErrors}
            </>
          ) : null}
        </p>

        <DemoNotice className="mt-4">
          {copy.demoNotice}. {copy.formNote}
        </DemoNotice>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Order summary                                                       */
/* ------------------------------------------------------------------ */

function OrderSummary({ className }: { className?: string }) {
  const { lines, pricing, openCart } = useCart();
  const headingId = useId();
  const pricedById = new Map(pricing.lines.map((priced) => [priced.lineId, priced]));
  const showGiftPouch = pricing.freePouch.eligible && pricing.freePouch.appliedToLineId === null;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("rounded-card bg-white p-5 ring-1 ring-line ring-inset sm:p-6 md:p-7", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-[1.5rem] leading-tight md:text-[1.75rem]">
          {copy.orderSummary}{" "}
          <span className="tabular ml-0.5 align-middle font-sans text-[13px] font-normal tracking-normal text-ink-soft">
            {cartCopy.drawer.itemCount(pricing.itemCount)}
          </span>
        </h2>
        <button
          type="button"
          onClick={openCart}
          className="inline-flex min-h-11 shrink-0 items-center rounded text-sm font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          {copy.editCart}
        </button>
      </div>

      <ul aria-label={cartCopy.drawer.linesLabel} className="mt-2 divide-y divide-line border-b border-line">
        {lines.map((line) => (
          <CartLine key={line.id} line={line} priced={pricedById.get(line.id)} readOnly />
        ))}
        {showGiftPouch ? <FreePouchLine /> : null}
      </ul>

      <DiscountField className="border-b border-line py-5" />

      <Totals pricing={pricing} className="pt-5" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Discount code                                                       */
/* ------------------------------------------------------------------ */

function DiscountField({ className }: { className?: string }) {
  const { pricing, discountCode, applyDiscountCode, clearDiscountCode } = useCart();
  const id = useId();
  const inputId = `${id}-code`;
  const rulesId = `${id}-rules`;
  const inputRef = useRef<HTMLInputElement>(null);
  const appliedRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim() === "") {
      setError(discountCopy.empty);
      inputRef.current?.focus();
      return;
    }
    const result = applyDiscountCode(code);
    if (!result.ok) {
      setError(discountCopy.errors[result.error]);
      inputRef.current?.focus();
      return;
    }
    setCode("");
    setError(null);
    // The field is replaced by the applied code; keep focus there (WCAG 2.4.3).
    requestAnimationFrame(() => appliedRef.current?.focus());
  }

  function remove() {
    clearDiscountCode();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (discountCode) {
    const applied = pricing.discount;
    const shownCode = applied?.code ?? discountCode;
    const problem = pricing.discountError ? discountCopy.errors[pricing.discountError] : null;
    return (
      <div ref={appliedRef} tabIndex={-1} className={cn("outline-offset-4", className)}>
        <p className="label-caps text-ink-soft">{discountCopy.label}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <p className="flex min-w-0 items-start gap-2 text-sm leading-snug text-ink">
            <span
              aria-hidden="true"
              className={cn(
                "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full",
                problem ? "ring-1 ring-ink/30 ring-inset" : "bg-kelp text-fog",
              )}
            >
              {problem ? null : <Check className="size-3" strokeWidth={2.5} />}
            </span>
            <span className="min-w-0">
              {applied ? discountCopy.applied(applied.code, applied.label) : shownCode}
              {problem ? <span className="mt-1 block text-ink-soft">{problem}</span> : null}
            </span>
          </p>
          <button
            type="button"
            onClick={remove}
            aria-label={discountCopy.removeCode(shownCode)}
            className="-my-2 inline-flex min-h-9 shrink-0 items-center rounded px-1 text-[13px] text-ink-soft underline decoration-ink/25 underline-offset-[3px] hover:text-ink hover:decoration-ink"
          >
            {discountCopy.removeShort}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={apply} className={className}>
      <label htmlFor={inputId} className="label-caps block text-ink-soft">
        {discountCopy.label}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          name="discountCode"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={64}
          placeholder={discountCopy.placeholder}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error && `${id}-error`, rulesId)}
          className={cn(fieldControlClasses(Boolean(error)), "uppercase placeholder:normal-case")}
        />
        <Button type="submit" variant="outline" className="px-5">
          {discountCopy.apply}
        </Button>
      </div>
      <p id={`${id}-error`} aria-live="polite" className={cn("flex items-start gap-1.5 text-sm leading-5 font-medium text-ink", error && "mt-2")}>
        {error ? (
          <>
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2.25} />
            {error}
          </>
        ) : null}
      </p>
      <p id={rulesId} className="mt-2 text-xs leading-snug text-ink-soft">
        {discountCopy.rules}
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */

function Row({ label, value, note, className }: { label: ReactNode; value: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <dt className="min-w-0">
        {label}
        {note ? <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{note}</span> : null}
      </dt>
      <dd className="tabular shrink-0 text-right">{value}</dd>
    </div>
  );
}

/** The non-zero parts of "You save" (PLAN §7 rule 8), as in the cart drawer. */
function savingsParts(pricing: PricingSummary): string[] {
  const parts = summaryCopy.savingsParts;
  return (
    [
      [parts.bundles, pricing.bundleSavings],
      [parts.subscription, pricing.subscriptionSavings],
      [parts.pouch, pricing.pouchSavings],
      [parts.code, pricing.discount?.amount ?? 0],
    ] as [string, number][]
  )
    .filter(([, amount]) => amount > 0)
    .map(([label, amount]) => summaryCopy.savingsPart(label, formatMoney(amount)));
}

function Totals({ pricing, className }: { pricing: PricingSummary; className?: string }) {
  const { shipping, discount } = pricing;
  const lineTotal = pricing.subtotal + (discount?.amount ?? 0);
  const grouped = getGroupedSetsSaving(pricing);
  const savings = savingsParts(pricing);

  let shippingValue: string;
  if (!shipping.requiresShipping) shippingValue = summaryCopy.digitalDelivery;
  else if (shipping.isFree) shippingValue = summaryCopy.shippingFree;
  else shippingValue = formatMoney(shipping.amount);

  return (
    <div className={className}>
      <dl className="space-y-2 text-sm text-ink">
        <Row
          label={summaryCopy.subtotal}
          value={formatMoney(lineTotal)}
          note={grouped > 0 ? summaryCopy.groupedSets(formatMoney(grouped)) : undefined}
        />
        {discount ? (
          <Row
            label={summaryCopy.discount(discount.code)}
            value={summaryCopy.minus(formatMoney(discount.amount))}
            note={discount.label}
          />
        ) : null}
        <Row
          label={shipping.requiresShipping ? summaryCopy.shippingTo(countryName(shipping.country)) : summaryCopy.shipping}
          value={<span className={cn(shipping.isFree && shipping.requiresShipping && "font-medium text-kelp")}>{shippingValue}</span>}
        />
        <Row
          label={<span className="text-base font-semibold">{summaryCopy.total}</span>}
          value={<span className="text-xl font-semibold">{formatMoney(pricing.total)}</span>}
          className="mt-3 border-t border-line pt-3"
        />
      </dl>

      {shipping.requiresShipping || pricing.totalSavings > 0 ? (
        <div className="mt-1.5 text-xs leading-snug text-ink-soft">
          <div className="flex items-baseline justify-between gap-4">
            {shipping.requiresShipping ? <p>{summaryCopy.taxesIncluded}</p> : <span />}
            {pricing.totalSavings > 0 ? (
              <p className="tabular font-medium text-kelp">{`${summaryCopy.youSave} ${formatMoney(pricing.totalSavings)}`}</p>
            ) : null}
          </div>
          {savings.length > 1 ? (
            <p className="tabular mt-0.5 text-right">
              {savings.map((part, index) => (
                <Fragment key={part}>
                  {index > 0 ? <span aria-hidden="true">{" · "}</span> : null}
                  {index > 0 ? <span className="sr-only">, </span> : null}
                  <span className="whitespace-nowrap">{part}</span>
                </Fragment>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty and confirmation states                                       */
/* ------------------------------------------------------------------ */

function EmptyCheckout() {
  const empty = copy.emptyCart;
  return (
    <section
      aria-labelledby="checkout-empty"
      className="mt-10 max-w-[40rem] rounded-card bg-white p-6 ring-1 ring-line ring-inset md:mt-14 md:p-10"
    >
      <h2 id="checkout-empty" className="text-[1.75rem] leading-tight md:text-[2.25rem]">
        {empty.headline}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-ink-soft md:text-lg">{empty.line}</p>
      <Button href={empty.cta.href} variant="primary" className="mt-8" iconEnd={<ArrowRightIcon className="size-[18px]" />}>
        {empty.cta.label}
      </Button>
    </section>
  );
}

function Confirmation({
  order,
  headingRef,
  onBack,
}: {
  order: PlacedOrder;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
}) {
  const result = copy.result;
  return (
    <section
      aria-labelledby="checkout-result"
      className="mt-10 max-w-[40rem] rounded-card bg-white p-6 ring-1 ring-line ring-inset md:mt-14 md:p-10"
    >
      <div role="status" aria-live="polite">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-kelp text-fog">
          <Check className="size-5" strokeWidth={2.25} />
        </span>
        <h2
          id="checkout-result"
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-[1.75rem] leading-tight md:text-[2.25rem]"
        >
          {result.heading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink md:text-lg">{result.body}</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{result.emailNote(order.email)}</p>
      </div>

      <dl className="mt-8 flex items-baseline justify-between gap-4 border-y border-line py-4">
        <dt className="text-sm text-ink-soft">{result.totalLabel}</dt>
        <dd className="tabular text-lg font-semibold text-ink">{formatMoney(order.total)}</dd>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button href={result.backToShop.href} variant="primary" iconEnd={<ArrowRightIcon className="size-[18px]" />}>
          {result.backToShop.label}
        </Button>
        <Button variant="ghost" onClick={onBack} className="underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
          {result.backToCheckout}
        </Button>
      </div>
    </section>
  );
}
