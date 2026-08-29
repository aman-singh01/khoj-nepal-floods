# 0006 — Reconcile records that leave a feed, with a grace period

**Status:** Accepted

## Context

An imported record's lifecycle doesn't end at "imported". On the source
registry a case gets resolved, merged, or withdrawn — and the row simply
**disappears from the export**. Khoj's original import was upsert-only, so a
"missing" record would stay published here long after the person was found
elsewhere, until it aged out at 180 days.

The naive fix — "delete anything not in the latest pull" — is dangerous: a
truncated response or a transient upstream error would wipe real records.

## Decision

After every feed pull, reconcile the imported set for that source:

- **First miss** → stamp `feed_missing_since` (record stays public — grace
  period).
- **Missing past 24h** (≈4 missed 6-hourly pulls) → move to `pending`: out of
  public view, into the moderation queue tagged *"no longer in <source> feed
  since …"*. A moderator's own hide/publish is left untouched.
- **Reappears** → clear the flag, and if reconciliation had held it, restore
  it to published automatically.
- **Guard** → skip reconciliation entirely if the pull returned nothing, or
  fewer than half the rows we hold for that source. A broken feed can't sweep
  records away; it logs `reconciliation skipped — feed looked truncated`.

## Consequences

- Stale "missing" records fade out on their own, but a human confirms the
  removal — nobody's record vanishes silently.
- Recovery is automatic, so a flapping upstream doesn't create moderator
  busywork for records that come straight back.
- Needs one nullable column (`persons.feed_missing_since`) and a per-source
  scan each pull — cheap at this scale (`persons_source_idx`).
- Verified live against the 147-record sodhera set: drop a case → grace; +30h
  → held; 1-of-147 truncated feed → skipped, nothing touched; re-add → restored.
