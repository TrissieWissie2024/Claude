import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata: Metadata = legalMetadata("legalNotice");

/** /legal-notice (docs/PLAN.md §1). Legal notice; the text lives in content/legal.ts. */
export default function LegalNoticePage() {
  return <LegalPage id="legalNotice" />;
}
