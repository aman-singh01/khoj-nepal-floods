import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { PersonCard } from "@/components/PersonCard";
import { Callout } from "@/components/Callout";
import { SetupNotice } from "@/components/SetupNotice";
import { recentPersons, stats, type PublicPerson, type Stats } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data: { recent: PublicPerson[]; counts: Stats } | null = null;
  let error: unknown = null;
  try {
    const [recent, counts] = await Promise.all([recentPersons(9), stats()]);
    data = { recent, counts };
  } catch (e) {
    error = e;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Find someone missing in the Nepal floods
        </h1>
        <p className="max-w-2xl text-muted">
          Search by name — any spelling works. If you can&apos;t find the person,
          add a record so others who have information can reach you. Anyone who
          has seen someone can post that too.
        </p>
        <SearchForm />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/report?type=seeking"
            className="rounded-md bg-accent px-4 py-2 font-medium text-accent-fg hover:opacity-90"
          >
            Report a missing person
          </Link>
          <Link
            href="/report?type=info"
            className="rounded-md border border-border px-4 py-2 font-medium hover:border-accent"
          >
            I have information about someone
          </Link>
        </div>
      </section>

      {error ? <SetupNotice error={error} /> : null}

      {data && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="People being sought" value={data.counts.seeking} />
          <Stat label="Reported safe or seen" value={data.counts.reunited} />
          <Stat label="Total records" value={data.counts.totalRecords} />
          <Stat label="Updated in 24h" value={data.counts.updatedToday} />
        </section>
      )}

      <Callout tone="warn" title="Beware of scams">
        No genuine volunteer or official will ask you to pay a fee to release or
        reunite a relative. Never send money. Report any record that asks for
        payment using the “Report this record” link on its page.
      </Callout>

      {data && data.recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Recently added</h2>
            <Link href="/persons" className="text-sm underline">
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
          <Link href="/report" className="underline">
            add one
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
