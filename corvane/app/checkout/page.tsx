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
 * CheckoutView. The top notice has the same shape and spacing as the review
 * notice on the legal pages (components/legal/LegalNotice), in kelp: both are
 * status notes about the page. The order summary, discount code, country,
 * address fields and the demo confirmation are client-side
 * (components/checkout/CheckoutView), because they read the cart from storage.
 */
export default function CheckoutPage() {
  const copy = cartCopy.checkout;

  return (
    <Container className="pt-8 pb-20 md:pt-10 md:pb-28 lg:pt-12 lg:pb-32">
      <p
        role="note"
        className="inline-flex max-w-full items-center gap-2.5 rounded-lg border border-transparent bg-kelp px-3.5 py-2 text-sm leading-snug font-semibold text-fog"
      >
        <Info aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
        {copy.demoNotice}
      </p>

      <SectionHeading
        level={1}
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        eyebrowRule="neutral"
        className="mt-10 md:mt-14"
      />

      <CheckoutView />
    </Container>
  );
}
