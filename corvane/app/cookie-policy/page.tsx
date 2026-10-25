import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";
import { legalRoutes } from "@/content/legal";
import { pageOpenGraph } from "@/lib/seo";

/** Title, description, canonical and robots (indexable) from LegalPage; Open Graph from lib/seo.ts. */
export const metadata: Metadata = { ...legalMetadata("cookies"), openGraph: pageOpenGraph(legalRoutes.cookies) };

/** /cookie-policy (docs/PLAN.md §1). Cookie Policy; the text lives in content/legal.ts. */
export default function CookiePolicyPage() {
  return <LegalPage id="cookies" />;
}
