# Deploying Khoj

Target: **Vercel** (Next.js host + cron) + **Neon** or **Supabase** (managed
Postgres) + **Vercel Blob** (photo storage). ~15 minutes.

## 1. Database

Create a Postgres database (Neon or Supabase free tier is fine) and copy its
pooled connection string — it must look like:

```
postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Apply the schema (idempotent, safe to re-run):

```bash
DATABASE_URL='postgres://…?sslmode=require' npm run db:migrate
```

## 2. Import to Vercel

Import the repo. Framework preset: **Next.js** (auto-detected). No build-command
changes needed — `vercel.json` is already in the repo (it also wires the crons).

Set environment variables (Project → Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the Postgres string from step 1 |
| `IP_HASH_SALT` | any long random string |
| `MODERATION_TOKEN` | a strong secret — unlocks `/moderation` and feed import |
| `CRON_SECRET` | a strong secret — Vercel Cron sends it automatically |
| `NEXT_PUBLIC_SITE_URL` | your deployed URL, e.g. `https://khoj.example.app` |
| `BLOB_READ_WRITE_TOKEN` | from Vercel → Storage → Blob (for photo uploads) |
| `RECORD_TTL_DAYS` | `180` (optional) |

Deploy.

## 3. Verify

- `GET /api/health` → `{ "ok": true }`
- `/` renders; `/official` shows the verified helplines
- `/moderation` → sign in with `MODERATION_TOKEN`
- **Crons** (Project → Settings → Cron Jobs) shows two jobs every 6h:
  `/api/updates/refresh` and `/api/feeds/refresh`. Trigger one manually and
  check `/updates` / `/persons` populate. (Vercel Hobby caps cron at once per
  day — either change the schedules in `vercel.json` to `0 6 * * *`, or run the
  GitHub Action in step 4 instead.)

## 4. Scheduled pulls without Vercel Cron (optional / Hobby plan)

`.github/workflows/pull-updates.yml` runs `updates:pull` + `feeds:pull` every
6h with no plan limits. Add a repo secret **`DATABASE_URL`** (same string as
step 1) and enable Actions. Or run `npm run data:watch` on any always-on box.

## 5. Before a real public launch

See [`INTEGRATIONS.md` §5](INTEGRATIONS.md) — this is a template, not a staffed
service. It needs real moderator accounts (not the shared token), a
privacy/legal review for the jurisdictions involved, coordination with the
authorities and Red Cross, and every entry in `official-sources.ts` confirmed
against a current advisory.
