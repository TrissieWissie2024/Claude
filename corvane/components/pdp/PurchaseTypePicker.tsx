"use client";

import { Check } from "lucide-react";
import { useId } from "react";

import { offers } from "@/content/offers";
import { pdp } from "@/content/pdp";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { PurchaseType, SubscriptionInterval } from "@/lib/types";

import { optionTileClasses, RadioMark } from "./BundlePicker";

/**
 * Purchase type on a stick page (docs/PLAN.md §9): a native radio group with
 * "One-time purchase" and "Subscribe & save 15%", each with its price for the
 * chosen set. With Subscribe & save the tile opens an interval group
 * (offers.subscription.intervalsMonths, default defaultIntervalMonths, from
 * PdpStateProvider), "Delivered and billed every N months" and the honest note
 * that recurring billing is not connected yet (content/pdp.ts).
 *
 * The interval panel sits inside the subscription tile but outside its
 * <label> (a label holds one control), so the tile is a container: its
 * outline shows only while the purchase type radio itself has focus.
 */

export interface PurchaseTypePickerProps {
  purchaseType: PurchaseType;
  intervalMonths: SubscriptionInterval;
  onPurchaseTypeChange: (type: PurchaseType) => void;
  onIntervalChange: (months: SubscriptionInterval) => void;
  /** Price of the chosen set bought once, in cents. */
  oneTimePrice: number;
  /** Price of the chosen set per subscription delivery, in cents. */
  subscriptionPrice: number;
  className?: string;
}

const PURCHASE_FOCUS =
  "has-[[data-purchase-radio]:focus-visible]:outline-2 has-[[data-purchase-radio]:focus-visible]:outline-offset-2 has-[[data-purchase-radio]:focus-visible]:outline-ink";

export function PurchaseTypePicker({
  purchaseType,
  intervalMonths,
  onPurchaseTypeChange,
  onIntervalChange,
  oneTimePrice,
  subscriptionPrice,
  className,
}: PurchaseTypePickerProps) {
  const name = useId();
  const intervalName = useId();
  const copy = pdp.purchaseType;
  const subscribed = purchaseType === "subscription";

  return (
    <fieldset className={className}>
      <legend className="label-caps mb-3 text-ink-soft">{copy.legend}</legend>
      <div className="grid gap-2.5">
        <label
          className={cn(
            "group flex cursor-pointer items-center gap-3.5 px-4 py-3.5 md:px-5 md:py-4",
            optionTileClasses(!subscribed),
          )}
        >
          <input
            type="radio"
            name={name}
            value="one-time"
            checked={!subscribed}
            onChange={() => onPurchaseTypeChange("one-time")}
            className="sr-only"
          />
          <RadioMark selected={!subscribed} />
          <span className="min-w-0 flex-1 text-[0.9375rem] leading-6 font-semibold text-ink">{copy.oneTime}</span>
          <span className="tabular text-[1.0625rem] leading-6 font-semibold whitespace-nowrap text-ink">
            {formatMoney(oneTimePrice)}
          </span>
        </label>

        <div className={cn(optionTileClasses(subscribed, "none"), PURCHASE_FOCUS)}>
          <label className="group flex cursor-pointer items-start gap-3.5 px-4 py-3.5 md:px-5 md:py-4">
            <input
              type="radio"
              name={name}
              value="subscription"
              checked={subscribed}
              onChange={() => onPurchaseTypeChange("subscription")}
              data-purchase-radio=""
              className="sr-only"
            />
            <RadioMark selected={subscribed} className="mt-0.5" />
            <span className="min-w-0 flex-1 text-[0.9375rem] leading-6 font-semibold text-ink">{copy.subscribe}</span>
            <span className="flex flex-col items-end">
              <span className="tabular text-[1.0625rem] leading-6 font-semibold whitespace-nowrap text-ink">
                {formatMoney(subscriptionPrice)}
              </span>
              <span className="text-xs leading-4 text-ink-soft">{copy.perDeliveryUnit}</span>
            </span>
          </label>

          {subscribed ? (
            <div className="px-4 pb-4 md:px-5 md:pb-5">
              <div className="border-t border-line pt-4 sm:ml-[2.125rem]">
                <fieldset>
                  <legend className="mb-2 text-[0.8125rem] leading-5 font-medium text-ink">
                    {copy.intervalLegendShort}
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {offers.subscription.intervalsMonths.map((months) => {
                      const selected = months === intervalMonths;
                      return (
                        <label
                          key={months}
                          className={cn(
                            "relative flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2",
                            "text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-150",
                            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                            selected
                              ? "border-ink bg-ink text-fog"
                              : "border-line bg-fog text-ink hover:border-ink/40",
                          )}
                        >
                          <input
                            type="radio"
                            name={intervalName}
                            value={months}
                            checked={selected}
                            onChange={() => onIntervalChange(months)}
                            className="sr-only"
                          />
                          {selected ? <Check aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.5} /> : null}
                          {copy.intervalsShort[months]}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <p className="mt-3 text-[0.8125rem] leading-5 font-medium text-ink">
                  {copy.deliveredAndBilled(intervalMonths)}
                </p>
                <p className="mt-1 text-xs leading-[1.125rem] text-ink-soft">{copy.subscriptionNote}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
