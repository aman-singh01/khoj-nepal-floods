# Architecture decision records

Short notes on the choices that shaped Khoj, and what they cost.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-pfif-as-interchange-format.md) | PFIF as the interchange format | Accepted |
| [0002](0002-dual-database-driver.md) | One data layer, two drivers (PGlite + Postgres) | Accepted |
| [0003](0003-polling-not-websockets.md) | Polling, not WebSockets, for live updates | Accepted |
| [0004](0004-in-app-fuzzy-name-matching.md) | Fuzzy name matching in the application, not the database | Accepted |
| [0005](0005-importing-community-data-as-unverified.md) | Import peer-registry data as unverified, attributed, scrubbed | Accepted |
| [0006](0006-feed-reconciliation.md) | Reconcile records that leave a feed, with a grace period | Accepted |

Format: Context (the forces), Decision (what and why), Consequences (the
trade-off we accepted).
