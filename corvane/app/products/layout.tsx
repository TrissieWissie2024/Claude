import type { ReactNode } from "react";

import { PdpStateProvider } from "@/components/pdp/PdpStateProvider";

/**
 * Layout for /products/[slug] (docs/PLAN.md §1, §9). It stays mounted while the
 * visitor switches between product pages, so PdpStateProvider keeps the tile,
 * purchase type, interval and extra sticks when they pick another scent.
 * A server component; only the provider is a client island. Adds no markup.
 */
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <PdpStateProvider>{children}</PdpStateProvider>;
}
