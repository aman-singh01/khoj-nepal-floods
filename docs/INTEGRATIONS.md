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
curl -X POST 'https://YOUR_HOST/api/pfif/import?source=np-nrcs' \
  -H 'x-khoj-token: <MODERATION_TOKEN>' \
  -H 'content-type: application/xml' \
  --data-binary @partner-export.xml
```

Response: `{ "imported": N, "updated": N, "skipped": N, "errors": [...] }`.

### b. Scheduled feed pull

1. In `src/config/official-sources.ts`, on a `kind: "feed"` entry, set a real
   `url`, pick `feedFormat` (`pfif` | `csv` | `json`), set `feedMapping` for
   csv/json (our field → their column), and `enabled: true`.
2. It runs on a schedule alongside the news pull — see section 4 below
   (`vercel.json` cron `/api/feeds/refresh`, or the GitHub Action's second step,
   or `npm run data:watch` / `npm run feeds:pull`).

**Currently enabled:** `sodhera-flood` — a one-way import of the peer community
registry at `flood.sodhera.com/api/export` (CSV). Imported records are:
- shown **"via flood.sodhera.com"** with an *unverified* badge and a callout
- run through `scrubContacts` — phone numbers, emails, passport/ID numbers and
  DOB are stripped from the free-text field; anything contact-shaped that
  survives holds the record for a moderator
- keyed on their case number (idempotent), rows marked removed/deleted skipped
- **excluded from Khoj's own `/api/pfif` export**, so data can't loop
- left untouched by re-pulls if a moderator has since published/hidden them

This is pending a proper two-way arrangement — see
[`outreach-sodhera.md`](outreach-sodhera.md). To turn it off, set
`enabled: false` on that entry.

### c. Ad-hoc URL pull (no config change)

```bash
curl -X POST 'https://YOUR_HOST/api/pfif/import' \
  -H 'x-khoj-token: <MODERATION_TOKEN>' -H 'content-type: application/json' \
  -d '{"sourceId":"feed-relief-camp-csv","url":"https://.../roster.csv","format":"csv","mapping":{"fullName":"name","status":"state","externalId":"id"}}'
```

### Field mapping notes

- `status` values must map to Khoj's set: `missing`, `seen_alive`, `safe`,
  `injured`, `deceased`, `unknown`.
- `externalId` is required for idempotent re-runs; without it, `fullName` is
  used and re-imports may duplicate.
- PFIF status → Khoj: `information_sought`/`believed_missing` → seeking/missing,
  `believed_alive` → info/seen_alive, `believed_dead` → info/deceased.

---

## 4. Live event-updates stream (`/updates`)

The `/updates` page and the home "Latest updates" card aggregate news and
humanitarian coverage of the emergency. Configured in
[`src/config/update-feeds.ts`](../src/config/update-feeds.ts).

**Ships enabled (no key needed):**
- **Google News RSS** — a search query scoped to the event.
- **UN News RSS** (Asia-Pacific), filtered to items that mention the event.

**Add-ons:**
- **ReliefWeb** — the best source for official situation reports, but its API
  needs a pre-approved `appname` since 1 Nov 2025. Register at
  <https://reliefweb.int/help/api>, then set `reliefwebAppname` and
  `enabled: true` on the `reliefweb-nepal` feed.
- **Any RSS/Atom feed** — add `{ kind: "rss", url, trust, filter? }`.

**How it refreshes:**
- **On page view** — a visit to `/updates` or `/` triggers a pull if the last
  one was over `UPDATES_TTL_MINUTES` (12) ago. De-duped across concurrent
  viewers. No cron required, but nothing pulls between visits.
- **Scheduled** (runs regardless of traffic — recommended):
  - **Vercel Cron** — [`vercel.json`](../vercel.json) is set to hit
    `/api/updates/refresh` every 6 h. Set a `CRON_SECRET` env var in the
    project; Vercel sends it as the `Authorization` header automatically.
    (Vercel Hobby caps cron at once per day — change the schedule to
    `0 6 * * *` or use the GitHub Action instead.)
  - **GitHub Actions** — [`.github/workflows/pull-updates.yml`](../.github/workflows/pull-updates.yml)
    runs `npm run updates:pull` every 6 h. Add a repo secret `DATABASE_URL`
    pointing at the production Postgres. No plan limits.
  - **Anywhere** — `npm run updates:pull` from cron / a systemd timer.

**Trust & moderation:** every item carries `official` / `humanitarian` / `news`
and links to its origin. Khoj does not fact-check them. On `/moderation`,
**pin** an authoritative item to the top or **hide** anything inaccurate or
off-topic. Items are deduped by URL and expire from the pull window after 30
days.

## 5. Before any of this goes live

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
