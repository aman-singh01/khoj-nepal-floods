# 0002 — One data layer, two drivers (PGlite + Postgres)

**Status:** Accepted

## Context

A crisis tool needs a frictionless "clone and run" story for contributors, and
a production database that scales. Those usually pull in opposite directions:
SQLite is trivial locally but diverges from Postgres; a real Postgres locally
means Docker or a hosted dev instance before anyone can see the app.

We also want tests to run against the *same* engine as production, not a
mock.

## Decision

Target Postgres, and pick the driver at runtime from `DATABASE_URL`:

- unset / `pglite` → **[PGlite](https://pglite.dev)**, Postgres compiled to
  WASM, running in-process with data in `./.pglite`. No install, no container.
- a `postgres://` URL → **postgres.js** against a real server (Neon, Supabase,
  RDS).

One Drizzle schema, one query layer (`src/lib/repo.ts`), both drivers. The
connection is created lazily (`getDb()`) so `next build` never opens a socket
or boots WASM. Tests set `DATABASE_URL=pglite:memory` and apply the schema
before each file.

Schema is a single idempotent SQL string (`src/db/ddl.ts`) rather than a
migration chain, so it applies the same way on PGlite and hosted Postgres and
needs no `drizzle-kit` at deploy time.

## Consequences

- `git clone && npm i && npm run db:migrate && npm run dev` works with nothing
  else installed. Tests run against real Postgres semantics.
- Two drivers to keep working. In practice the surface is small — Drizzle
  abstracts the dialect, and `db.$client` is only reached in one test helper.
- PGlite's extension loading is finicky outside a bundler, which pushed fuzzy
  matching into the application (see
  [0004](0004-in-app-fuzzy-name-matching.md)) — a constraint that turned out
  to be a portability win.
- Idempotent DDL instead of migrations means schema changes are
  `ADD COLUMN IF NOT EXISTS`, not versioned diffs. Fine at this size; would
  revisit past a few contributors.
