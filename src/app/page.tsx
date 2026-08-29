import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { PersonCard } from "@/components/PersonCard";
import { Callout } from "@/components/Callout";
import { SetupNotice } from "@/components/SetupNotice";
import { LiveRefresh } from "@/components/LiveRefresh";
import { EVENT } from "@/config/official-sources";
import {
  feedVersion,
  recentPersons,
  stats,
  type PublicPerson,
  type Stats,
} from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data: { recent: PublicPerson[]; counts: Stats; version: string } | null =
    null;
  let error: unknown = null;
  try {
    const [recent, counts, version] = await Promise.all([
      recentPersons(9),
      stats(),
      feedVersion(),
    ]);
    data = { recent, counts, version };
  } catch (e) {
    error = e;
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative -mx-4 -mt-10 overflow-hidden border-b border-border bg-gradient-to-b from-accent-weak to-bg px-4 pb-10 pt-12 sm:-mx-6 sm:px-6 sm:pt-16">
        <div className="topo pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Nepal floods · family reconnection
          </p>
          <h1 className="text-balance font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            Find someone missing in the Nepal floods
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted sm:text-lg">
            Search by name — any spelling works. If you can&apos;t find the person,
            add a record so others who have information can reach you. Anyone who
            has seen someone can post that too.
          </p>

          <div className="mt-6">
            <SearchForm />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/report?type=seeking" className="btn-primary">
              Report a missing person
            </Link>
            <Link href="/report?type=info" className="btn-secondary">
              I have information about someone
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted">
            <strong className="text-text">{EVENT.name}</strong>, {EVENT.date}.{" "}
            <Link href="/official" className="text-accent-strong underline underline-offset-2">
              Official helplines &amp; portals →
            </Link>
          </p>
        </div>
      </section>

      {error ? <SetupNotice error={error} /> : null}

      {data && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="People being sought" value={data.counts.seeking} icon="search" />
          <Stat label="Reported safe or seen" value={data.counts.reunited} icon="check" />
          <Stat label="Total records" value={data.counts.totalRecords} icon="stack" />
          <Stat label="Updated in 24h" value={data.counts.updatedToday} icon="clock" />
        </section>
      )}

      <Callout tone="warn" title="Beware of scams">
        No genuine volunteer or official will ask you to pay a fee to release or
        reunite a relative. Never send money. Report any record that asks for
        payment using the “Report this record” link on its page.
      </Callout>

      {data && data.recent.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-lg font-semibold">Recently added</h2>
              <LiveRefresh
                key="/api/live/feed"
                src="/api/live/feed"
                initialVersion={data.version}
              />
            </div>
            <Link
              href="/persons"
              className="text-sm font-medium text-accent-strong underline underline-offset-2"
            >
              See all records
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}

      {data && data.recent.length === 0 && (
        <p className="text-muted">
          No records yet. Be the first to{" "}
          <Link href="/report" className="text-accent-strong underline underline-offset-2">
            add one
          </Link>
          .
        </p>
      )}
    </div>
  );
}

const ICONS: Record<string, string> = {
  search:
    "M9 3a6 6 0 1 0 3.7 10.7l3.3 3.3 1.4-1.4-3.3-3.3A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
  check:
    "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.7 6.3-4.2 4.2a1 1 0 0 1-1.4 0L5.9 10.3l1.4-1.4 1.5 1.5 3.5-3.5 1.4 1.4Z",
  stack:
    "M10 2 2 6l8 4 8-4-8-4Zm-6 7.2L2 10l8 4 8-4-1.9-.8L10 12 4 9.2Z",
  clock:
    "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 8V5H9v6h5v-2h-4Z",
};

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof ICONS;
}) {
  return (
    <div className="card p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-weak text-accent-strong">
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <path d={ICONS[icon]} fill="currentColor" />
        </svg>
      </span>
      <div className="tnum font-display text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
