import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "next/server": resolve(__dirname, "node_modules/next/server.js"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: [resolve(__dirname, "tests/setup/vitest.setup.ts")],
  },
});
