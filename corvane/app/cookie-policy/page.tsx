import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata: Metadata = legalMetadata("cookies");

/** /cookie-policy (docs/PLAN.md §1). Cookie Policy; the text lives in content/legal.ts. */
export default function CookiePolicyPage() {
  return <LegalPage id="cookies" />;
}
