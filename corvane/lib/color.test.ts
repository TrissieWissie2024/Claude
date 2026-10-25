import { describe, expect, it } from "vitest";

import { contrastRatio, markToneOn, relativeLuminance } from "./color";

describe("color", () => {
  it("computes WCAG contrast", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(relativeLuminance("not a colour")).toBeNull();
  });

  it("picks the check colour with the most contrast on each ring colour", () => {
    // Launch ring colours (content/products.ts).
    expect(markToneOn("#6FA8C7")).toBe("ink"); // North Swell
    expect(markToneOn("#C26A3D")).toBe("ink"); // Drift & Ember (ink 4.8:1, fog 3.6:1)
    expect(markToneOn("#8B2E2E")).toBe("fog"); // Lantern Smoke
    expect(markToneOn("#8C9399")).toBe("ink"); // Iron Coast
    expect(markToneOn("#7E9A5B")).toBe("ink"); // Dune Fig
    expect(markToneOn("#A9844F")).toBe("ink"); // Harbour Tea
    for (const ring of ["#6FA8C7", "#C26A3D", "#8B2E2E", "#8C9399", "#7E9A5B", "#A9844F"]) {
      const tone = markToneOn(ring) === "ink" ? "#101418" : "#F7F5F1";
      expect(contrastRatio(ring, tone)).toBeGreaterThanOrEqual(3);
    }
  });
});
