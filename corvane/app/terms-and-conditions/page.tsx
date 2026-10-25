import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";
import { legalRoutes } from "@/content/legal";
import { pageOpenGraph } from "@/lib/seo";

/** Title, description, canonical and robots (indexable) from LegalPage; Open Graph from lib/seo.ts. */
export const metadata: Metadata = { ...legalMetadata("terms"), openGraph: pageOpenGraph(legalRoutes.terms) };

/** /terms-and-conditions (docs/PLAN.md §1). Terms & Conditions; the text lives in content/legal.ts. */
export default function TermsAndConditionsPage() {
  return <LegalPage id="terms" />;
}
