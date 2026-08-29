import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getPersonPublic, personVersion } from "@/lib/repo";
import { StatusBadge } from "@/components/StatusBadge";
import { Callout } from "@/components/Callout";
import { LiveRefresh } from "@/components/LiveRefresh";
import {
  AddNoteForm,
  ContactForm,
  ReportRecordForm,
  RemoveRecordForm,
} from "@/components/PersonForms";
import { OfficialResources } from "@/components/OfficialResources";
import { avatarHue, formatAge, relativeTime, STATUS_LABELS } from "@/lib/ui";
import { SITE_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPersonPublic(id).catch(() => null);
  if (!data) return { title: "Record not found" };
  return {
    title: `${data.person.fullName} — ${STATUS_LABELS[data.person.status]}`,
    description: data.person.description ?? undefined,
  };
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [data, version] = await Promise.all([
    getPersonPublic(id).catch(() => null),
    personVersion(id).catch(() => null),
  ]);
  if (!data) notFound();

  const { person, notes } = data;
  const jar = await cookies();
  const isOwner = Boolean(jar.get(`khoj_edit_${id}`)?.value);
  const justCreated = sp.created === "1";
  const pending = sp.pending === "1";
  const photoErr = sp.photo === "err";

  const details: [string, string | null][] = [
    ["Also known as", person.alsoKnownAs],
    ["Age", formatAge(person)],
    ["Sex", person.sex === "unknown" ? null : person.sex],
    ["Nationality", person.nationality],
    ["Home", person.homeLocation],
    ["Last seen", person.lastSeenLocation],
    [
      "Last seen on",
      person.lastSeenAt ? new Date(person.lastSeenAt).toLocaleDateString() : null,
    ],
  ];

  const shareUrl = `${SITE_URL}/persons/${person.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <p className="text-sm">
        <Link
          href="/persons"
          className="inline-flex items-center gap-1 text-muted transition hover:text-text"
        >
          <span aria-hidden>←</span> Back to search
        </Link>
      </p>

      {justCreated && (
        <Callout tone={pending ? "warn" : "success"} title="Record submitted">
          {pending ? (
            <p>
              Because it mentioned payment or contact details in the description,
              this record is <strong>held for a moderator</strong> and is not
              public yet. You will still see it on this page.
            </p>
          ) : (
            <p>Your record is now public and searchable.</p>
          )}
          {photoErr && <p className="mt-1">Note: the photo could not be saved.</p>}
          <p className="mt-2">
            Save this link to check for updates or edit the record from this
            device:
            <br />
            <code className="break-all text-xs">{shareUrl}</code>
          </p>
        </Callout>
      )}

      <header className="card overflow-hidden">
        <div className="flex flex-col gap-5 bg-gradient-to-br from-accent-weak/60 to-surface p-5 sm:flex-row sm:p-6">
          <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl shadow-sm">
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photoUrl}
                alt={`Photo of ${person.fullName}`}
                width={144}
                height={144}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="avatar flex h-full w-full items-center justify-center font-display text-5xl font-semibold"
                style={{ "--av-h": avatarHue(person.fullName) } as CSSProperties}
                aria-hidden
              >
                {person.fullName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold">
                {person.fullName}
              </h1>
              <StatusBadge status={person.status} />
            </div>
            <p className="text-sm text-muted">
              {person.recordType === "seeking"
                ? "A family member or friend is looking for this person."
                : "Someone has posted information about this person."}
              {person.authorIsVerified && " Posted by a verified responder."}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
        <p className="border-t border-border px-5 py-2.5 text-xs text-muted sm:px-6">
          Added {relativeTime(person.createdAt)} · last updated{" "}
          {relativeTime(person.updatedAt)}
          {person.importedFrom
            ? ` · imported from ${person.importedFrom}`
            : person.authorName && ` · by ${person.authorName}`}
          {!person.importedFrom &&
            person.authorRelation &&
            ` (${person.authorRelation})`}
        </p>
      </header>

      {person.description && (
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {person.description}
          </p>
        </section>
      )}

      <OfficialResources nationality={person.nationality} />

      <section>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="font-display text-lg font-semibold">
            Updates &amp; sightings
          </h2>
          <LiveRefresh
            key={`/api/live/person/${person.id}`}
            src={`/api/live/person/${person.id}`}
            initialVersion={version}
          />
        </div>
        {notes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No updates yet. If you know anything, add it below.
          </p>
        ) : (
          <ol className="space-y-5 border-l-2 border-border pl-5">
            {notes.map((n) => (
              <li key={n.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-surface bg-accent" />
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">
                    {n.noteType === "sighting"
                      ? "Sighting"
                      : n.noteType === "status_update"
                        ? "Status update"
                        : "Note"}
                  </span>
                  {n.statusReported && <StatusBadge status={n.statusReported} />}
                  <span className="text-xs text-muted">
                    {relativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {n.text}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {n.lastKnownLocation && `📍 ${n.lastKnownLocation} · `}
                  {n.authorName ?? "Anonymous"}
                  {n.authorRelation && ` (${n.authorRelation})`}
                  {n.authorIsVerified && " · verified"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">
          Add an update or sighting
        </h2>
        <AddNoteForm personId={person.id} />
      </section>

      <section className="card p-5">
        <h2 className="mb-2 font-display text-lg font-semibold">
          Contact the person who posted this
        </h2>
        <ContactForm personId={person.id} />
      </section>

      {isOwner && (
        <section className="rounded-2xl border border-rose-300 bg-surface p-5 shadow-sm dark:border-rose-900/70">
          <h2 className="mb-2 font-display text-lg font-semibold">
            Manage your record
          </h2>
          <p className="mb-3 text-sm text-muted">
            You submitted this record from this device. You can remove it from
            public view (this is reversible by a moderator).
          </p>
          <RemoveRecordForm personId={person.id} />
        </section>
      )}

      <div>
        <ReportRecordForm personId={person.id} />
      </div>
    </div>
  );
}
