# 0004 — Fuzzy name matching in the application, not the database

**Status:** Accepted

## Context

Transliterated names are spelled many ways — "Shrestha" / "Shreshtha",
"Gurung" / "Gurun", "Aarati" / "Arati". Exact and prefix matching miss most
real searches. The obvious tool is Postgres **`pg_trgm`** (trigram similarity +
a GIN index).

But: `pg_trgm` is an extension. It isn't available on every managed host
without enabling it, and loading it into the embedded PGlite used for
dev/tests proved unreliable outside a bundler context. Requiring it would
break the "clone and run" story ([0002](0002-dual-database-driver.md)).

## Decision

Do candidate retrieval in SQL and **ranking in the application**:

1. Normalise the query (case-fold, strip Latin diacritics, keep other scripts).
2. Pull a broad candidate set with `ILIKE '%token%'` per token plus the raw
   string; fall back to recent records if that's empty.
3. Score each candidate in JS — Sørensen–Dice over trigram sets, plus a
   token-containment bonus so "arati shresta" still ranks "Aarati Shrestha"
   highly — and keep those above a threshold.

No extension. Identical behaviour on PGlite and any Postgres.

## Consequences

- Zero database dependencies; fuzzy search works everywhere the app does.
- The `ILIKE` candidate scan is a sequential scan. Fine into the tens of
  thousands of records (single-digit milliseconds). Past that, add a
  `pg_trgm` GIN index on `name_normalized` purely as an optimisation — the
  ranking code doesn't change, only the candidate query gets faster.
- Ranking logic is testable in isolation (`src/lib/fuzzy.ts`), which it
  wouldn't be if it lived in a SQL `ORDER BY similarity(...)`.
- Not script-aware yet: Devanagari ↔ Latin transliteration ("श्रेष्ठ" vs
  "Shrestha") is a known follow-up.
