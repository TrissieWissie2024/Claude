import { serializeJsonLd, type JsonLdDocument } from "@/lib/seo";

export interface JsonLdProps {
  /** A schema.org document, built with the helpers in lib/seo.ts (homeJsonLd, productPageJsonLd). */
  data: JsonLdDocument;
}

/**
 * Structured data as a plain <script type="application/ld+json"> (not
 * next/script), rendered on the server into the static HTML. "<" is escaped
 * as < (serializeJsonLd), so the content can never close the element.
 */
export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
