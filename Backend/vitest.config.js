import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [
      "./tests/setup/env.setup.js",
      "./tests/setup/test-bootstrap.js",
    ],
    include: ["tests/**/*.test.js"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
