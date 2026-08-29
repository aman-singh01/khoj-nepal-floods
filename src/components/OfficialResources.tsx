import {
  sourcesForCountry,
  type OfficialSource,
} from "@/config/official-sources";

const COUNTRY_LABEL: Record<string, string> = {
  np: "Nepal",
  in: "India",
  us: "United States",
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
        {s.verified ? (
          <span className="badge bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-400/20">
            verified {s.verifiedOn}
          </span>
        ) : (
          <span className="badge bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-400/20">
            unverified
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{s.purpose}</p>
      <p className="mt-1.5 text-xs text-muted">{s.authority}</p>
      <div className="mt-2 flex flex-col gap-1 text-sm">
        {s.phone && (
          <p className="tnum font-medium">
            <span aria-hidden>☎ </span>
            {s.phone}
          </p>
        )}
        {s.email && (
          <p>
            <a
              href={`mailto:${s.email}`}
              className="text-accent-strong underline underline-offset-2"
            >
              {s.email}
            </a>
          </p>
        )}
        {s.url && (
          <p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-strong underline underline-offset-2"
            >
              Open portal ↗
            </a>
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Compact panel for a record page: the official bodies relevant to this
 * person's nationality, plus services open to any nationality.
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
