import type { Config } from "drizzle-kit";

/**
 * Only needed if you want `drizzle-kit` tooling (studio, introspection).
 * The app itself applies the schema via `npm run db:migrate` (src/db/ddl.ts).
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/khoj",
  },
} satisfies Config;
