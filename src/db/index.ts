import * as schema from "./schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * One database module, two drivers:
 *  - No DATABASE_URL (or "pglite"): an embedded Postgres (PGlite) with data in
 *    ./.pglite. Zero setup - good for local dev, tests and demos.
 *  - A postgres:// URL: a real Postgres server (Neon, Supabase, RDS, ...).
 *
 * No Postgres extensions are required. Run `npm run db:migrate` to create the
 * schema.
 *
 * The connection is created lazily on first use so that importing this module
 * during `next build` (page-data collection) does not spin up WASM or open a
 * socket to a production database.
 */

export type Database = PostgresJsDatabase<typeof schema>;

const url = process.env.DATABASE_URL?.trim();
const usePglite = !url || url === "pglite" || url.startsWith("pglite:");

const globalForDb = globalThis as unknown as {
  __khojDb?: Database;
  __khojDbPromise?: Promise<Database>;
};

async function createDb(): Promise<Database> {
  if (usePglite) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dataDir =
      url && url.startsWith("pglite:")
        ? url.slice("pglite:".length)
        : "./.pglite";
    const client = new PGlite(dataDir === "memory" ? undefined : dataDir);
    return drizzle(client, { schema }) as unknown as Database;
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const client = postgres(url!, { max: 10, prepare: false });
  return drizzle(client, { schema });
}

/** Get the shared database handle, creating it on first call. */
export function getDb(): Promise<Database> {
  if (globalForDb.__khojDb) return Promise.resolve(globalForDb.__khojDb);
  if (!globalForDb.__khojDbPromise) {
    globalForDb.__khojDbPromise = createDb().then((d) => {
      globalForDb.__khojDb = d;
      return d;
    });
  }
  return globalForDb.__khojDbPromise;
}

export { schema };
