import { Info } from "lucide-react";
import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/CheckoutView";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cartCopy } from "@/content/cart";
import { pages } from "@/content/pages";

export const metadata: Metadata = {
  title: pages.checkout.meta.title,
  description: pages.checkout.meta.description,
  robots: { index: false, follow: false },
};

/**
 * /checkout (brief §6, docs/PLAN.md §1): the demo checkout. The notice
 * "Demo checkout: no payment is taken" (exact text from the brief) stands at
 * the top of the page, before the heading, and again by the button inside
 * CheckoutView. The order summary, discount code, country, address fields
 * and the demo confirmation are client-side (components/checkout/CheckoutView),
 * because they read the cart from storage.
 */
export default function CheckoutPage() {
  const copy = cartCopy.checkout;

  return (
    <Container className="pt-8 pb-20 md:pt-10 md:pb-28 lg:pt-12 lg:pb-32">
      <p className="flex items-center gap-3 rounded-xl bg-kelp px-4 py-3.5 text-[0.9375rem] leading-snug font-semibold text-fog md:px-5 md:text-base">
        <Info aria-hidden="true" className="size-5 shrink-0" strokeWidth={2} />
        {copy.demoNotice}
      </p>

      <SectionHeading level={1} title={copy.title} intro={copy.intro} className="mt-10 md:mt-12" />

      <CheckoutView />
    </Container>
  );
}
