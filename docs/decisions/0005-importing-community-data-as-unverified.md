# 0005 — Import peer-registry data as unverified, attributed, scrubbed

**Status:** Accepted

## Context

`flood.sodhera.com` is a peer volunteer registry for the same flood with a
public CSV export (`/api/export`, ~150 records). Ingesting it makes Khoj more
useful faster. But the data is:

- **community-reported** and mostly self-flagged `unverified`,
- itself **second-hand** — many rows note "Source: public gen.znepal
  missing-person post" (they're aggregating social media),
- carrying **PII in free text** — phone numbers, passport numbers, dates of
  birth in the `identifying details` field, which Khoj deliberately keeps
  private.

The clean options were "don't ingest external person data" or "coordinate a
two-way sync first" (an outreach draft exists at
[`../outreach-sodhera.md`](../outreach-sodhera.md)). The chosen path is a
one-way import done carefully, pending that coordination.

## Decision

Import it, with guardrails baked into `upsertImported`:

- **Provenance.** Records show *"imported from flood.sodhera.com"* with an
  **unverified** badge and a callout — *"treat it as a lead, not a
  confirmation."* A feed's `unverified` flag sets `authorIsVerified = false`.
- **PII scrubbing.** `scrubContacts` strips phone numbers, emails, and
  labelled passport / ID / citizenship / licence numbers and DOB from the
  free-text field before storage. Anything contact-shaped that survives holds
  the record for a moderator instead of publishing.
- **No loop.** Imported records are excluded from Khoj's own `/api/pfif`
  export, so data can't ping-pong between the two boards.
- **Idempotent + moderator-safe.** Keyed on the source's case number; re-pulls
  update in place but never override a moderator's publish/hide.
- **Reversible.** `enabled: false` on the config entry turns it off.

## Consequences

- ~150 real records appear immediately, clearly marked as what they are.
- Verified: a live pull ingested 147 rows with zero phone/passport/DOB leaking
  into a published description.
- Khoj is now third-hand from some families (social media → sodhera → Khoj).
  The provenance labelling is load-bearing; the real fix is the two-way sync.
- The scrubber is regex-based and conservative — it sometimes over-removes,
  leaving a slightly clipped sentence. Acceptable trade for not publishing a
  stranger's passport number.
