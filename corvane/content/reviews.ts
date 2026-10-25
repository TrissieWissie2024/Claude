import type { Review } from "@/lib/types";

/**
 * Real customer reviews only (brief §2.2). Empty at launch.
 * Fill this from a review app (e.g. Judge.me) once real orders exist;
 * until then every rating and review component shows nothing or an empty state.
 */
export const reviews: Review[] = [];
