import { cn } from "@/lib/cn";

/**
 * Class names of the product grid, in their own module so the client
 * SortableProductGrid can share them with the server ProductGrid without
 * importing ProductCard (and the renders) into the client bundle.
 */

/** Classes of the grid <ul>: 2 columns on phones, 3 from md, 4 from xl; the column gap lives in --card-gap. */
export const productGridClassName = cn(
  "grid grid-cols-2 gap-x-(--card-gap) gap-y-10 [--card-gap:0.75rem]",
  "sm:[--card-gap:1rem] md:grid-cols-3 md:gap-y-14 md:[--card-gap:1.5rem] xl:grid-cols-4 xl:gap-y-16",
);

/** Classes of the <li> of the wide card: the full row below xl, two columns from xl (--card-span). */
export const wideGridItemClassName =
  "col-span-2 [--card-span:2] md:col-span-3 md:[--card-span:3] xl:col-span-2 xl:[--card-span:2]";
