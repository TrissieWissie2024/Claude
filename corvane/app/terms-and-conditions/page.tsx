import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata: Metadata = legalMetadata("terms");

/** /terms-and-conditions (docs/PLAN.md §1). Terms & Conditions; the text lives in content/legal.ts. */
export default function TermsAndConditionsPage() {
  return <LegalPage id="terms" />;
}
