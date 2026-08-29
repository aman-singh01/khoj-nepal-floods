import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // Set before any module (incl. src/db) is imported.
    env: {
      DATABASE_URL: "pglite:memory",
      IP_HASH_SALT: "test-salt",
      MODERATION_TOKEN: "test-mod-token",
      RECORD_TTL_DAYS: "30",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
    // PGlite instances are per-file; run files sequentially to keep memory low.
    fileParallelism: false,
  },
});
