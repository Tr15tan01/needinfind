import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // See test/stubs/server-only.ts for why this is aliased rather than
      // left to resolve to the real package.
      "server-only": path.resolve(import.meta.dirname, "test/stubs/server-only.ts")
    }
  }
});
