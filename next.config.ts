import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Keep builds resilient during a crisis push; run `npm run typecheck` in CI instead.
  eslint: { ignoreDuringBuilds: true },
  // This project sits beside other lockfiles; pin the tracing root to itself.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  experimental: {
    // Server Actions handle form posts; allow slightly larger bodies for photo uploads.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
