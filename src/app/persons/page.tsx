import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { PersonCard } from "@/components/PersonCard";
import { SetupNotice } from "@/components/SetupNotice";
import { searchPersons, type PublicPerson } from "@/lib/repo";
import { STATUSES, RECORD_TYPES } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search records" };

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() || undefined;
  const statusRaw = one(sp.status);
  const status = STATUSES.includes(statusRaw as never)
    ? (statusRaw as (typeof STATUSES)[number])
    : undefined;
  const typeRaw = one(sp.recordType);
  const recordType = RECORD_TYPES.includes(typeRaw as never)
    ? (typeRaw as (typeof RECORD_TYPES)[number])
    : undefined;
  const nationality = one(sp.nationality)?.trim() || undefined;

  const hasQuery = Boolean(q || status || recordType || nationality);

  let results: PublicPerson[] | null = null;
  let error: unknown = null;
  try {
    results = await searchPersons({ q, status, recordType, nationality });
  } catch (e) {
    error = e;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search records</h1>
      <SearchForm defaults={{ q, status, nationality }} />

      {error ? <SetupNotice error={error} /> : null}

      {results && (
        <>
          <p className="text-sm text-muted">
            {hasQuery
              ? `${results.length} record${results.length === 1 ? "" : "s"} match your search`
              : `Showing ${results.length} most recent record${results.length === 1 ? "" : "s"}`}
          </p>

          {results.length === 0 && (
            <div className="rounded-lg border border-border bg-surface p-6 text-center">
              <p className="mb-3">No matching records found.</p>
              <Link
                href={`/report?type=seeking${q ? `&name=${encodeURIComponent(q)}` : ""}`}
                className="inline-block rounded-md bg-accent px-4 py-2 font-medium text-accent-fg"
              >
                Add a record for this person
              </Link>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
