/**
 * Apply the schema to the configured database.
 *
 *   npm run db:migrate
 *
 * Safe to run repeatedly - every statement in ddl.ts is idempotent.
 */
import "./load-env";
import { DDL } from "./ddl";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  const usePglite = !url || url === "pglite" || url.startsWith("pglite:");

  if (usePglite) {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir =
      url && url.startsWith("pglite:") ? url.slice("pglite:".length) : "./.pglite";
    const pg = new PGlite(dir === "memory" ? undefined : dir);
    await pg.exec(DDL);
    await pg.close();
    console.log(`Schema applied to embedded PGlite (${dir}).`);
    return;
  }

  const postgres = (await import("postgres")).default;
  const sql = postgres(url!, { max: 1 });
  await sql.unsafe(DDL);
  await sql.end();
  console.log("Schema applied to Postgres.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
