import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";
import { legalRoutes } from "@/content/legal";
import { pageOpenGraph } from "@/lib/seo";

/** Title, description, canonical and robots (indexable) from LegalPage; Open Graph from lib/seo.ts. */
export const metadata: Metadata = { ...legalMetadata("privacy"), openGraph: pageOpenGraph(legalRoutes.privacy) };

/** /privacy-policy (docs/PLAN.md §1). Privacy Policy; the text lives in content/legal.ts. */
export default function PrivacyPolicyPage() {
  return <LegalPage id="privacy" />;
}
