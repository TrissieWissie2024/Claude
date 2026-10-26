import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    // Components with logic that a rule of brief §2 depends on are tested too (rendered to static markup in node).
    include: ["lib/**/*.test.ts", "content/**/*.test.ts", "components/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
