import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getPersonPublic } from "@/lib/repo";
import { StatusBadge } from "@/components/StatusBadge";
import { Callout } from "@/components/Callout";
import {
  AddNoteForm,
  ContactForm,
  ReportRecordForm,
  RemoveRecordForm,
} from "@/components/PersonForms";
import { formatAge, relativeTime, STATUS_LABELS } from "@/lib/ui";
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
  const data = await getPersonPublic(id).catch(() => null);
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
        <Link href="/persons" className="text-muted underline">
          ← Back to search
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

      <header className="flex flex-col gap-4 sm:flex-row">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-lg bg-border">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={`Photo of ${person.fullName}`}
              width={160}
              height={160}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-5xl text-muted">
              {person.fullName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{person.fullName}</h1>
            <StatusBadge status={person.status} />
          </div>
          <p className="text-sm text-muted">
            {person.recordType === "seeking"
              ? "A family member or friend is looking for this person."
              : "Someone has posted information about this person."}
            {person.authorIsVerified && " Posted by a verified responder."}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {details
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <p className="text-xs text-muted">
            Added {relativeTime(person.createdAt)} · last updated{" "}
            {relativeTime(person.updatedAt)}
            {person.authorName && ` · by ${person.authorName}`}
            {person.authorRelation && ` (${person.authorRelation})`}
          </p>
        </div>
      </header>

      {person.description && (
        <section>
          <h2 className="mb-1 font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm">{person.description}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Updates &amp; sightings</h2>
        <ol className="space-y-3 border-l border-border pl-4">
          {notes.length === 0 && (
            <li className="text-sm text-muted">
              No updates yet. If you know anything, add it below.
            </li>
          )}
          {notes.map((n) => (
            <li key={n.id} className="relative">
              <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-accent" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">
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
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{n.text}</p>
              <p className="mt-0.5 text-xs text-muted">
                {n.lastKnownLocation && `📍 ${n.lastKnownLocation} · `}
                {n.authorName ?? "Anonymous"}
                {n.authorRelation && ` (${n.authorRelation})`}
                {n.authorIsVerified && " · verified"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold">Add an update or sighting</h2>
        <AddNoteForm personId={person.id} />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold">
          Contact the person who posted this
        </h2>
        <ContactForm personId={person.id} />
      </section>

      {isOwner && (
        <section className="rounded-xl border border-rose-300 bg-surface p-4 dark:border-rose-800">
          <h2 className="mb-2 font-semibold">Manage your record</h2>
          <p className="mb-2 text-sm text-muted">
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
