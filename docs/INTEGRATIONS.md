# Connecting Khoj to official systems

Khoj ships **not connected to any government system**. This document is the
runbook for the site operator to link it to the authoritative services for a
specific emergency.

There is **no single India–Nepal missing-persons list**. The interoperable
pieces are:

| Country | Bodies | Interchange |
| --- | --- | --- |
| Nepal | NDRRMA (BIPAD Portal), Ministry of Home Affairs / NEOC, Nepal Police, Nepal Red Cross Society, Ministry of Foreign Affairs | PFIF, ICRC RFL |
| India | Ministry of External Affairs (+ Embassy of India, Kathmandu), MADAD portal, NDMA/NDRF, Indian Red Cross Society | PFIF, ICRC RFL, consular case system |
| Cross-border | **ICRC Restoring Family Links** / Trace the Face, IOM, UNHCR | **PFIF 1.3/1.4** |

The lingua franca is **PFIF** (People Finder Interchange Format). Khoj both
exports and imports it.

---

## 1. Fill in the source registry

Edit [`src/config/official-sources.ts`](../src/config/official-sources.ts).

For every `portal` / `helpline` entry:

1. Open the ministry / mission's advisory for **this** emergency.
2. Confirm the URL is the right destination and copy the **event-specific**
   control-room phone / email into `phone` (it is `null` by default — do not
   guess; numbers change per event).
3. Set `verified: true`, `verifiedOn`, `verifiedBy`.

The `/official` page and the per-record "Also contact an official service"
panel render straight from this file. Unverified entries are shown with an
`unverified` badge.

---

## 2. Export: let agencies pull from Khoj

Already live, no configuration:

```
GET /api/pfif                       # all published records, PFIF 1.4
GET /api/pfif?since=2026-08-29T00:00:00Z   # delta since a timestamp
```

Give this URL to a partner so they can ingest Khoj's community reports.

---

## 3. Import: bring an official / partner list into Khoj

Imported records are marked **verified source**, attributed on-screen
("imported from …"), skip the moderation hold, and upsert idempotently (keyed on
`import:<sourceId>:<externalId>`).

### a. One-off / manual PFIF push

```bash
curl -X POST 'https://YOUR_HOST/api/pfif/import?source=np-nrcs-rfl' \
  -H 'x-khoj-token: <MODERATION_TOKEN>' \
  -H 'content-type: application/xml' \
  --data-binary @partner-export.xml
```

Response: `{ "imported": N, "updated": N, "skipped": N, "errors": [...] }`.

### b. Scheduled feed pull

1. In `src/config/official-sources.ts`, on a `kind: "feed"` entry, set a real
   `url`, pick `feedFormat` (`pfif` | `csv` | `json`), set `feedMapping` for
   csv/json (our field → their column), and `enabled: true`.
2. Run `npm run feeds:pull` on a schedule:
   - **Vercel Cron** — add to `vercel.json`:
     ```json
     { "crons": [{ "path": "/api/cron/feeds", "schedule": "*/15 * * * *" }] }
     ```
     (add a thin `/api/cron/feeds` route that checks the `CRON_SECRET` header
     and calls `ingestFeed` for each `enabledFeeds()`), **or**
   - **GitHub Actions** — a workflow on a `schedule:` trigger running
     `npm run feeds:pull` with `DATABASE_URL` in secrets.

### c. Ad-hoc URL pull (no config change)

```bash
curl -X POST 'https://YOUR_HOST/api/pfif/import' \
  -H 'x-khoj-token: <MODERATION_TOKEN>' -H 'content-type: application/json' \
  -d '{"sourceId":"relief-camp-csv","url":"https://.../roster.csv","format":"csv","mapping":{"fullName":"name","status":"state","externalId":"id"}}'
```

### Field mapping notes

- `status` values must map to Khoj's set: `missing`, `seen_alive`, `safe`,
  `injured`, `deceased`, `unknown`.
- `externalId` is required for idempotent re-runs; without it, `fullName` is
  used and re-imports may duplicate.
- PFIF status → Khoj: `information_sought`/`believed_missing` → seeking/missing,
  `believed_alive` → info/seen_alive, `believed_dead` → info/deceased.

---

## 4. Before any of this goes live

- [ ] **Authorization.** A data-sharing agreement / MOU with each agency whose
      data you ingest or to whom you push. Volunteer status does not grant
      access to a police / consular database.
- [ ] **Data protection.** Confirm lawful basis for processing personal data in
      the relevant jurisdictions; define retention (Khoj: `RECORD_TTL_DAYS`),
      a takedown path, and a point of contact.
- [ ] **Provenance.** Keep imported records clearly attributed (Khoj does this)
      and never present a community report as an official confirmation.
- [ ] **Moderator accounts.** Replace the shared `MODERATION_TOKEN` with real
      per-person accounts before handing the import capability to anyone.
- [ ] **Verify every helpline** against the current official advisory.
- [ ] **ICRC first.** Where possible, route families to ICRC Restoring Family
      Links rather than creating a parallel authority.
