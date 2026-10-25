import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";
import { legalRoutes } from "@/content/legal";
import { pageOpenGraph } from "@/lib/seo";

/** Title, description, canonical and robots (indexable) from LegalPage; Open Graph from lib/seo.ts. */
export const metadata: Metadata = { ...legalMetadata("legalNotice"), openGraph: pageOpenGraph(legalRoutes.legalNotice) };

/** /legal-notice (docs/PLAN.md §1). Legal notice; the text lives in content/legal.ts. */
export default function LegalNoticePage() {
  return <LegalPage id="legalNotice" />;
}
