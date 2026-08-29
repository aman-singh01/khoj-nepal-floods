# 0003 — Polling, not WebSockets, for live updates

**Status:** Accepted

## Context

When a sighting is posted or a status flips to "safe", people watching that
record should see it without reloading. The deploy target is Vercel
(serverless functions) with managed Postgres, and the app must also run
locally on PGlite.

Options:

- **WebSockets / SSE from the app.** True push, but Vercel functions are
  short-lived — a long-lived socket server needs a separate always-on process
  (Fly.io, a container) or a managed service.
- **A managed realtime service** (Supabase Realtime, Pusher, Ably). Instant,
  but couples the project to a vendor and, for Supabase Realtime,
  specifically to Supabase Postgres.
- **Client polling.** Works on any host, degrades gracefully, no new
  infrastructure.

## Decision

**Poll.** Each live surface renders a `<LiveRefresh>` client component that
fetches a tiny version-string endpoint (`/api/live/{feed,person/[id],
moderation,updates}`) every ~10s (foreground) / ~20s (background), and calls
`router.refresh()` when the value changes. All rendering stays server-side and
sanitised — the poll only decides *when* to re-fetch.

Details that make it acceptable: exponential backoff on errors, immediate
re-check on tab focus / reconnect, a jittered interval, and a small "Live"
indicator so it's honest about the model.

## Consequences

- Runs unchanged on Vercel + Neon and on a laptop with PGlite. No vendor, no
  extra process.
- Updates land within one interval, not instantly. For a crisis board "within
  10 seconds" is fine; for a trading app it wouldn't be.
- The abstraction is a seam: `<LiveRefresh>` could open a Supabase channel or
  a WebSocket and call `router.refresh()` on the event instead, with no change
  to any page. The upgrade path is one component.
- Extra request volume. Bounded by the backoff and visibility pausing; would
  add `Cache-Control`/edge coalescing before it mattered.
