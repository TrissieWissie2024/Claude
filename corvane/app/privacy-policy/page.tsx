import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata: Metadata = legalMetadata("privacy");

/** /privacy-policy (docs/PLAN.md §1). Privacy Policy; the text lives in content/legal.ts. */
export default function PrivacyPolicyPage() {
  return <LegalPage id="privacy" />;
}
