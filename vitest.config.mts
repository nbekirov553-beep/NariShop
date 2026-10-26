import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/cache": fileURLToPath(new URL("./src/tests/stubs/next-cache.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/tests/**/*.test.ts"],
    environment: "node",
    // Первый запрос поднимает встроенный PostgreSQL и применяет миграции.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: { DATABASE_URL: "" },
  },
});
