import type { Metadata } from "next";
import { OFFICIAL_SOURCES, type OfficialSource } from "@/config/official-sources";
import { COUNTRY_LABEL } from "@/components/OfficialResources";
import { Callout } from "@/components/Callout";

export const metadata: Metadata = { title: "Official help" };

const ORDER: OfficialSource["country"][] = ["np", "in", "intl"];

function Card({ s }: { s: OfficialSource }) {
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">{s.name}</h3>
        {!s.verified && (
          <span className="badge bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-400/20">
            unverified
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{s.purpose}</p>
      <p className="mt-1.5 text-xs text-muted">{s.authority}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {s.url && (
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-strong underline underline-offset-2"
          >
            Open ↗
          </a>
        )}
        {s.phone ? (
          <span className="tnum">☎ {s.phone}</span>
        ) : (
          <span className="text-muted">
            {s.kind === "helpline" ? "phone number not set" : ""}
          </span>
        )}
      </div>
      {s.notes && <p className="mt-2 text-xs text-muted">{s.notes}</p>}
    </li>
  );
}

export default function OfficialPage() {
  const feeds = OFFICIAL_SOURCES.filter((s) => s.kind === "feed");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Official help</h1>
        <p className="mt-1 text-muted">
          Government and Red Cross services for people affected by the Nepal
          floods. Khoj is not run by any of them.
        </p>
      </div>

      <Callout tone="warn" title="Verify before relying on this">
        This list is a starting point maintained by the site operator. Entries
        marked <strong>unverified</strong> have not yet been confirmed against an
        official advisory for this emergency, and crisis helpline numbers change
        per event. Always cross-check with the ministry or mission&rsquo;s own
        announcement.
      </Callout>

      {ORDER.map((cc) => {
        const items = OFFICIAL_SOURCES.filter(
          (s) => s.country === cc && s.kind !== "feed",
        );
        if (!items.length) return null;
        return (
          <section key={cc} className="space-y-3">
            <h2 className="font-display text-xl font-semibold">
              {COUNTRY_LABEL[cc]}
            </h2>
            <ul className="space-y-3">
              {items.map((s) => (
                <Card key={s.id} s={s} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Data feeds</h2>
        <p className="text-sm text-muted">
          When a partner agency shares a verified list, the operator connects it
          here and its records appear in Khoj marked as a verified source.
        </p>
        <ul className="space-y-2">
          {feeds.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3 text-sm"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-muted">
                {s.feedFormat?.toUpperCase()}
              </span>
              <span
                className={`badge ${
                  s.enabled
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-400/20"
                    : "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15"
                }`}
              >
                {s.enabled ? "connected" : "not connected"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
