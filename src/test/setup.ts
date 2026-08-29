import { beforeAll } from "vitest";
import { getDb } from "@/db";
import { DDL } from "@/db/ddl";

/**
 * Every test file gets its own fresh in-memory Postgres (PGlite). Apply the
 * schema once before the file's tests run.
 */
beforeAll(async () => {
  const db = await getDb();
  // drizzle-orm/pglite exposes the raw client here; it supports multi-statement
  // exec, which drizzle's own .execute() does not.
  const client = (db as unknown as { $client: { exec(sql: string): Promise<unknown> } })
    .$client;
  await client.exec(DDL);
});
