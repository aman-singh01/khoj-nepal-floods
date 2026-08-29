# 0001 — PFIF as the interchange format

**Status:** Accepted

## Context

Khoj is one of several missing-persons boards for the same disaster (a
government portal, the Red Cross, a peer volunteer site, Khoj). Families win
when data flows between them and lose when each board is a silo. We needed a
way for other systems to read Khoj's records and for Khoj to ingest theirs
without a bespoke integration per partner.

Options considered:

- **A custom JSON API.** Full control, but every partner needs a custom
  adapter, and we'd be reinventing a schema for a solved problem.
- **PFIF (People Finder Interchange Format).** The XML standard Google Person
  Finder defined after the 2010 Haiti earthquake and used across disasters
  since, including the 2015 Nepal earthquake. Understood by ICRC-adjacent
  tooling.
- **HXL / activity-standard formats.** Aimed at aggregate humanitarian data,
  not person records.

## Decision

Speak **PFIF 1.4** as the primary interchange format.

- `GET /api/pfif` exports every Khoj-authored published record as PFIF, with
  `?since=` for deltas.
- `POST /api/pfif/import` ingests a PFIF document.
- The feed pipeline also accepts CSV and JSON with a column mapping, because
  most real feeds in this event turned out to be CSV — but PFIF is the format
  we lead with and the one we tell partners to consume.

Status mapping is explicit: `information_sought` / `believed_missing` →
seeking/missing, `believed_alive` → info/seen-alive, `believed_dead` →
info/deceased.

## Consequences

- Zero-friction interop with anything in the Person Finder lineage; a partner
  can consume `/api/pfif` today with no code from us.
- PFIF is verbose XML and its vocabulary is dated (it predates a lot of how
  people think about consent and provenance). We layer our own fields —
  verification status, import provenance — outside the PFIF envelope.
- Imported records are **excluded** from `/api/pfif` (see
  [0005](0005-importing-community-data-as-unverified.md)), so the standard
  doesn't become a data-loop vector.
