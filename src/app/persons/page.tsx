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
      <h1 className="font-display text-2xl font-semibold">Search records</h1>
      <SearchForm defaults={{ q, status, nationality }} />

      {error ? <SetupNotice error={error} /> : null}

      {results && (
        <>
          <p className="text-sm text-muted">
            {hasQuery
              ? results.length === 1
                ? "1 record matches your search"
                : `${results.length} records match your search`
              : `Showing ${results.length} most recent record${results.length === 1 ? "" : "s"}`}
          </p>

          {results.length === 0 && (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="m17 17 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <p className="text-muted">No matching records found.</p>
              <Link
                href={`/report?type=seeking${q ? `&name=${encodeURIComponent(q)}` : ""}`}
                className="btn-primary"
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
