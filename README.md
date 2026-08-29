# Khoj — missing-persons finder for the Nepal floods

A volunteer board that helps families reconnect with relatives missing after the
Nepal floods. People can **report a missing person**, **post a sighting or status
update**, and **search** existing records by name (any spelling). Built to be
usable on a slow phone connection and to hand data off to official tracing
services.

> **Not an official service.** For formal tracing, work with the
> [ICRC Restoring Family Links](https://familylinks.icrc.org/) programme and the
> Nepal Red Cross Society.

## What it does

| Area | Detail |
| --- | --- |
| Two record types | "I'm looking for someone" and "I have information about someone", mirroring Google Person Finder. |
| Fuzzy name search | Transliteration- and typo-tolerant ("arati shresta" finds "Aarati Shrestha"). Ranking runs in the app, so **no Postgres extensions are required**. |
| Record page | Photo, details, a running timeline of sightings/status updates; a published status update moves the person's headline status. |
| Mediated contact | Searchers message the submitter through a moderator. Submitter phone/email are **never shown publicly or in the data export**. |
| Anti-abuse | Per-IP rate limiting (hashed IPs only), a honeypot field, automatic hold of records that mention payment/money, a "Report this record" button, and auto-hold after repeated reports. |
| Moderation | `/moderation` queue (token-gated) to publish/hide held records and resolve reports. |
| Interop | `GET /api/pfif` exports every published record as [PFIF 1.4](https://zesty.ca/pfif/1.4/) (`?since=` for deltas). `POST /api/pfif/import` (token-gated) ingests PFIF / CSV / JSON from a partner or official feed; imported records are marked a **verified source**, attributed on-screen, and upsert idempotently. `npm run feeds:pull` runs configured feeds on a schedule. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md). |
| Official-services directory | `/official` page + a per-record "Also contact an official service" panel filtered by nationality (Nepal / India / US / any), driven by [`src/config/official-sources.ts`](src/config/official-sources.ts). Ships with the **verified** helplines for the Aug 2026 Bhotekoshi–Trishuli flood — Nepal MoFA Emergency Control Room (`emergency@mofa.gov.np`, +977 974 444 1227/8), the national `1234` / Police `100` lines, and India's MEA Special Control Room + Embassy of India Kathmandu numbers — each carrying a `verified <date>` / source stamp. Re-check before a public launch. |
| Data retention | Records carry an `expires_at` (default 180 days) and can be removed on request. |
| Live updates (self-refresh) | Record pages, the home feed + counters, search results, the `/updates` stream, and the moderation queue refresh themselves when the underlying data changes. Each page polls a tiny `/api/live/*` version endpoint (~10s foreground, ~20s background, backs off on error) and re-fetches the server render on a change. No websockets; a push transport (Supabase Realtime / Pusher) can layer on the same `LiveRefresh` component later. |
| Event news stream | `/updates` + a home "Latest updates" card aggregate coverage of the emergency from Google News and UN News RSS (ReliefWeb once you register an `appname`), deduped by URL, each tagged `official` / `humanitarian` / `news` and linked to its origin. Refreshes on page view (12-min TTL, de-duped) or via `npm run updates:pull` / `POST /api/updates/refresh`. Moderators pin or hide items on `/moderation`. Config: [`src/config/update-feeds.ts`](src/config/update-feeds.ts). |
| Accessibility | Labelled controls, keyboard focus styles, reduced-motion support, works without JavaScript for search and (progressively) forms. |

## Stack

- **Next.js 15** (App Router, Server Actions) + TypeScript + Tailwind CSS v4
- **Postgres** via **Drizzle ORM**
  - Local/dev/test: [PGlite](https://pglite.dev) — embedded Postgres, zero setup, data in `./.pglite`
  - Production: any Postgres (Neon, Supabase, RDS, …) via `DATABASE_URL`
- Photo storage: local disk in dev; **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set

## Getting started

```bash
npm install
cp .env.example .env.local     # defaults work out of the box (embedded DB)
npm run db:migrate             # create the schema
npm run db:seed                # optional: a few clearly-fictional records
npm run dev
```

Open http://localhost:3000. Moderator sign-in is at `/moderation` with the
`MODERATION_TOKEN` from your env (`dev-moderator-token` by default).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:migrate` | Apply `src/db/ddl.ts` (idempotent) |
| `npm run db:seed` | Insert sample records (skips if any exist) |
| `npm test` | Vitest unit + integration tests (run against in-memory PGlite) |
| `npm run typecheck` | `tsc --noEmit` |

## Deploying (Vercel + managed Postgres)

1. Create a Postgres database (Neon or Supabase) and copy its connection string.
2. Import the repo into Vercel. Set env vars:
   - `DATABASE_URL` — the Postgres connection string (`?sslmode=require`)
   - `IP_HASH_SALT` — a long random string
   - `MODERATION_TOKEN` — a strong secret
   - `NEXT_PUBLIC_SITE_URL` — the deployed URL
   - `BLOB_READ_WRITE_TOKEN` — from Vercel Blob (for photo uploads)
3. Run the migration against the production database once:
   `DATABASE_URL=... npm run db:migrate`
4. Deploy.

### Scaling note

Name ranking is done in the application over an `ILIKE` candidate set. That is
fine into the tens of thousands of records. Past that, add a `pg_trgm` GIN index
on `persons.name_normalized` as a pure optimisation — the ranking code does not
change.

## Data model

`persons` (a sought/annotated person) · `notes` (sightings & status updates) ·
`abuse_reports` · `contact_messages` (mediated messages awaiting relay). See
[`src/db/schema.ts`](src/db/schema.ts).

## Operating this responsibly

The software is a fraction of the work. A service families rely on also needs:
coordination with Nepali authorities (NEOC) and the Red Cross, a small
moderation rota, a takedown/complaints path, and a privacy/legal review for the
jurisdictions involved. Treat the moderation token as an interim measure and
move to real accounts before any public launch.
