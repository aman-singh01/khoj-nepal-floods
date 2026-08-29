import type { Metadata } from "next";
import Link from "next/link";
import { isModerator } from "@/lib/moderation-auth";
import { moderate, moderatorLogout } from "@/app/actions";
import { moderationQueue, moderationVersion, moderationUpdates } from "@/lib/repo";
import { ModLogin } from "@/components/ModLogin";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Callout } from "@/components/Callout";
import { REASON_LABELS } from "@/lib/validation";
import { relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

function OpButton({
  op,
  id,
  children,
  danger,
}: {
  op: string;
  id: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <form action={moderate} className="inline">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <button
        className={`rounded border px-2 py-1 text-xs font-medium ${
          danger
            ? "border-rose-400 text-rose-600"
            : "border-emerald-400 text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {children}
      </button>
    </form>
  );
}

export default async function ModerationPage() {
  if (!(await isModerator())) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="font-display text-2xl font-semibold">Moderator sign-in</h1>
        <Callout tone="info">
          This area is for volunteers reviewing held records and abuse reports.
          The token is configured by the site operator.
        </Callout>
        <ModLogin />
      </div>
    );
  }

  const [{ pendingPersons, pendingNotes, openReports }, version, updates] =
    await Promise.all([
      moderationQueue(),
      moderationVersion(),
      moderationUpdates(),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold">Moderation queue</h1>
          <LiveRefresh
            key="/api/live/moderation"
            src="/api/live/moderation"
            initialVersion={version}
          />
        </div>
        <form action={moderatorLogout}>
          <button className="text-sm text-muted underline underline-offset-2 hover:text-text">
            Sign out
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">
          Held records ({pendingPersons.length})
        </h2>
        {pendingPersons.length === 0 && (
          <p className="text-sm text-muted">Nothing waiting.</p>
        )}
        {pendingPersons.map((p) => (
          <div key={p.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/persons/${p.id}`}
                  className="font-medium underline"
                >
                  {p.fullName}
                </Link>
                <span className="ml-2 text-xs text-muted">
                  {p.recordType} · reports: {p.reportCount} ·{" "}
                  {relativeTime(p.createdAt.toISOString())}
                  {p.feedMissingSince && (
                    <span className="ml-1 text-amber-700 dark:text-amber-400">
                      · no longer in {p.source.replace(/^import:/, "")} feed since{" "}
                      {relativeTime(p.feedMissingSince.toISOString())}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <OpButton op="person_publish" id={p.id}>
                  Publish
                </OpButton>
                <OpButton op="person_hide" id={p.id} danger>
                  Hide
                </OpButton>
              </div>
            </div>
            {p.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {p.description}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Contact on file: {p.authorEmail || p.authorPhone || "none"} ·{" "}
              submitter hash {p.submitterIpHash?.slice(0, 8) ?? "—"}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Held updates ({pendingNotes.length})</h2>
        {pendingNotes.length === 0 && (
          <p className="text-sm text-muted">Nothing waiting.</p>
        )}
        {pendingNotes.map((n) => (
          <div key={n.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/persons/${n.personId}`}
                className="text-sm underline"
              >
                on record {n.personId.slice(0, 8)}…
              </Link>
              <div className="flex gap-2">
                <OpButton op="note_publish" id={n.id}>
                  Publish
                </OpButton>
                <OpButton op="note_hide" id={n.id} danger>
                  Hide
                </OpButton>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{n.text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Open reports ({openReports.length})</h2>
        {openReports.length === 0 && (
          <p className="text-sm text-muted">No open reports.</p>
        )}
        {openReports.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm">
                <span className="font-medium">
                  {REASON_LABELS[r.reason as keyof typeof REASON_LABELS] ??
                    r.reason}
                </span>
                {r.personId && (
                  <>
                    {" "}
                    on{" "}
                    <Link
                      href={`/persons/${r.personId}`}
                      className="underline"
                    >
                      record {r.personId.slice(0, 8)}…
                    </Link>
                  </>
                )}
                <span className="ml-2 text-xs text-muted">
                  {relativeTime(r.createdAt.toISOString())}
                </span>
              </div>
              <OpButton op="report_resolve" id={r.id}>
                Mark resolved
              </OpButton>
            </div>
            {r.detail && <p className="mt-1 text-sm text-muted">{r.detail}</p>}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Event updates ({updates.length})</h2>
        <p className="text-sm text-muted">
          Aggregated from feeds. Pin an authoritative item to the top of{" "}
          <Link href="/updates" className="underline">
            /updates
          </Link>
          , or hide anything inaccurate or off-topic.
        </p>
        {updates.map((u) => (
          <div
            key={u.id}
            className="rounded-lg border border-border bg-surface p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="text-xs text-muted">
                  {u.trust} · {u.source} · {relativeTime(u.publishedAt.toISOString())}
                  {u.pinned && " · 📌"}
                  {u.hidden && " · hidden"}
                </span>
                <br />
                <a
                  href={u.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  {u.title}
                </a>
              </span>
              <div className="flex shrink-0 gap-2">
                {u.pinned ? (
                  <OpButton op="update_unpin" id={u.id}>
                    Unpin
                  </OpButton>
                ) : (
                  <OpButton op="update_pin" id={u.id}>
                    Pin
                  </OpButton>
                )}
                {u.hidden ? (
                  <OpButton op="update_show" id={u.id}>
                    Unhide
                  </OpButton>
                ) : (
                  <OpButton op="update_hide" id={u.id} danger>
                    Hide
                  </OpButton>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
