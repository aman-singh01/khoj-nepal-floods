import {
  sourcesForCountry,
  type OfficialSource,
} from "@/config/official-sources";

const COUNTRY_LABEL: Record<string, string> = {
  np: "Nepal",
  in: "India",
  intl: "International",
};

function SourceRow({ s }: { s: OfficialSource }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{s.name}</span>
        <span className="badge bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15">
          {COUNTRY_LABEL[s.country]}
        </span>
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
            Open portal ↗
          </a>
        )}
        {s.phone && <span className="tnum">☎ {s.phone}</span>}
        {!s.phone && s.kind === "helpline" && (
          <span className="text-muted">phone number not set</span>
        )}
      </div>
    </li>
  );
}

/**
 * Compact panel for a record page: the official bodies relevant to this
 * person's nationality, plus international networks.
 */
export function OfficialResources({
  nationality,
  className = "",
}: {
  nationality?: string | null;
  className?: string;
}) {
  const sources = sourcesForCountry(nationality);
  if (sources.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-border bg-surface-2/50 p-5 ${className}`}
    >
      <h2 className="font-display text-lg font-semibold">
        Also contact an official service
      </h2>
      <p className="mt-1 text-sm text-muted">
        Khoj is volunteer-run. For official tracing, register this person with — or
        check — the services below.
        {nationality
          ? ` Shown for nationality: ${nationality}.`
          : " Add a nationality to the record to narrow this list."}
      </p>
      <ul className="mt-3 space-y-2">
        {sources.map((s) => (
          <SourceRow key={s.id} s={s} />
        ))}
      </ul>
    </section>
  );
}

export { COUNTRY_LABEL };
