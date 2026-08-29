/**
 * Load .env.local / .env for standalone scripts (migrate, seed). Next.js does
 * this automatically for the app itself, but tsx scripts do not.
 */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file absent - fine
  }
}
