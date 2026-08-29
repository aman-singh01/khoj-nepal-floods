import { and, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/db";
import {
  persons,
  notes,
  abuseReports,
  contactMessages,
  type Person,
  type Note,
} from "@/db/schema";
import { normalizeName } from "./text";
import { scoreName, tokenize, MATCH_THRESHOLD } from "./fuzzy";
import { screenText } from "./safety";
import { RECORD_TTL_DAYS } from "./env";
import type { PersonInput, NoteInput } from "./validation";
import { sourceById } from "@/config/official-sources";
import type { NormalizedRecord } from "./feeds/types";

export interface SubmitContext {
  ipHash: string | null;
  source?: string;
}

/** A person record with all private fields removed - safe to send to a browser. */
export interface PublicPerson {
  id: string;
  recordType: Person["recordType"];
  fullName: string;
  alsoKnownAs: string | null;
  ageYears: number | null;
  ageIsApprox: boolean;
  sex: Person["sex"];
  nationality: string | null;
  homeLocation: string | null;
  lastSeenLocation: string | null;
  lastSeenAt: string | null;
  description: string | null;
  photoUrl: string | null;
  status: Person["status"];
  authorName: string | null;
  authorRelation: string | null;
  authorIsVerified: boolean;
  /** Display name of the official source this record was imported from, if any. */
  importedFrom: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface PublicNote {
  id: string;
  noteType: Note["noteType"];
  text: string;
  statusReported: Note["statusReported"];
  lastKnownLocation: string | null;
  authorName: string | null;
  authorRelation: string | null;
  authorIsVerified: boolean;
  createdAt: string;
}

export function toPublicPerson(p: Person): PublicPerson {
  return {
    id: p.id,
    recordType: p.recordType,
    fullName: p.fullName,
    alsoKnownAs: p.alsoKnownAs,
    ageYears: p.ageYears,
    ageIsApprox: p.ageIsApprox,
    sex: p.sex,
    nationality: p.nationality,
    homeLocation: p.homeLocation,
    lastSeenLocation: p.lastSeenLocation,
    lastSeenAt: p.lastSeenAt ? p.lastSeenAt.toISOString() : null,
    description: p.description,
    photoUrl: p.photoUrl,
    status: p.status,
    authorName: p.authorName,
    authorRelation: p.authorRelation,
    authorIsVerified: p.authorIsVerified,
    importedFrom: importedFromLabel(p.source),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    expiresAt: p.expiresAt.toISOString(),
  };
}

/** "import:np-nrcs" -> "Nepal Red Cross Society — Restoring Family Links". */
export function importedFromLabel(source: string): string | null {
  if (!source.startsWith("import:")) return null;
  const id = source.slice("import:".length);
  return sourceById(id)?.name ?? id;
}

export function toPublicNote(n: Note): PublicNote {
  return {
    id: n.id,
    noteType: n.noteType,
    text: n.text,
    statusReported: n.statusReported,
    lastKnownLocation: n.lastKnownLocation,
    authorName: n.authorName,
    authorRelation: n.authorRelation,
    authorIsVerified: n.authorIsVerified,
    createdAt: n.createdAt.toISOString(),
  };
}

function ttlDate(): Date {
  return new Date(Date.now() + RECORD_TTL_DAYS * 24 * 60 * 60 * 1000);
}

// --- Writes -----------------------------------------------------------------

export async function createPerson(
  input: PersonInput,
  ctx: SubmitContext,
): Promise<{ id: string; editToken: string; held: boolean }> {
  const db = await getDb();
  const screen = screenText(input.description, input.authorName, input.fullName);
  const editToken = randomUUID();

  const [row] = await db
    .insert(persons)
    .values({
      recordType: input.recordType,
      fullName: input.fullName,
      nameNormalized: normalizeName(
        `${input.fullName} ${input.alsoKnownAs ?? ""}`,
      ),
      alsoKnownAs: input.alsoKnownAs,
      ageYears: input.ageYears,
      ageIsApprox: input.ageIsApprox,
      sex: input.sex,
      nationality: input.nationality,
      homeLocation: input.homeLocation,
      lastSeenLocation: input.lastSeenLocation,
      lastSeenAt: input.lastSeenAt,
      description: input.description,
      status: input.recordType === "seeking" ? "missing" : input.status,
      authorName: input.authorName,
      authorRelation: input.authorRelation,
      authorEmail: input.authorEmail,
      authorPhone: input.authorPhone,
      editToken,
      source: ctx.source ?? "web",
      submitterIpHash: ctx.ipHash,
      moderationState: screen.hold ? "pending" : "published",
      expiresAt: ttlDate(),
    })
    .returning({ id: persons.id });

  return { id: row!.id, editToken, held: screen.hold };
}

export async function attachPhoto(personId: string, url: string): Promise<void> {
  const db = await getDb();
  await db
    .update(persons)
    .set({ photoUrl: url, updatedAt: new Date() })
    .where(eq(persons.id, personId));
}

export async function addNote(
  input: NoteInput,
  ctx: SubmitContext,
): Promise<{ id: string; held: boolean }> {
  const db = await getDb();
  const screen = screenText(input.text, input.authorName);

  const [row] = await db
    .insert(notes)
    .values({
      personId: input.personId,
      noteType: input.noteType,
      text: input.text,
      statusReported: input.statusReported,
      lastKnownLocation: input.lastKnownLocation,
      authorName: input.authorName,
      authorRelation: input.authorRelation,
      authorEmail: input.authorEmail,
      authorPhone: input.authorPhone,
      source: ctx.source ?? "web",
      submitterIpHash: ctx.ipHash,
      moderationState: screen.hold ? "pending" : "published",
    })
    .returning({ id: notes.id });

  // A published status update moves the person's headline status with it.
  if (!screen.hold && input.statusReported) {
    await db
      .update(persons)
      .set({ status: input.statusReported, updatedAt: new Date() })
      .where(eq(persons.id, input.personId));
  }

  return { id: row!.id, held: screen.hold };
}

export async function fileReport(args: {
  personId?: string;
  noteId?: string;
  reason: (typeof abuseReports.$inferInsert)["reason"];
  detail?: string;
  ipHash: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.insert(abuseReports).values({
    personId: args.personId,
    noteId: args.noteId,
    reason: args.reason,
    detail: args.detail,
    reporterIpHash: args.ipHash,
  });

  if (args.personId) {
    const [p] = await db
      .update(persons)
      .set({ reportCount: sql`${persons.reportCount} + 1` })
      .where(eq(persons.id, args.personId))
      .returning({ count: persons.reportCount });
    // Auto-hide once several independent reports pile up; a moderator reviews.
    if ((p?.count ?? 0) >= 3) {
      await db
        .update(persons)
        .set({ moderationState: "pending" })
        .where(
          and(eq(persons.id, args.personId), eq(persons.moderationState, "published")),
        );
    }
  }
}

export async function sendContactMessage(args: {
  personId: string;
  fromName: string;
  fromContact: string;
  message: string;
  ipHash: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.insert(contactMessages).values({
    personId: args.personId,
    fromName: args.fromName,
    fromContact: args.fromContact,
    message: args.message,
    senderIpHash: args.ipHash,
  });
}

// --- Reads ----------------------------------------------------------------

export interface SearchParams {
  q?: string;
  status?: Person["status"];
  recordType?: Person["recordType"];
  nationality?: string;
  limit?: number;
}

export async function searchPersons(params: SearchParams): Promise<PublicPerson[]> {
  const db = await getDb();
  const limit = Math.min(params.limit ?? 60, 100);
  const filters: SQL[] = [eq(persons.moderationState, "published")];

  if (params.status) filters.push(eq(persons.status, params.status));
  if (params.recordType) filters.push(eq(persons.recordType, params.recordType));
  if (params.nationality)
    filters.push(ilike(persons.nationality, `%${params.nationality}%`));

  const q = params.q?.trim();
  const norm = q ? normalizeName(q) : "";

  // No name query: newest first, filtered.
  if (!norm) {
    const rows = await db
      .select()
      .from(persons)
      .where(and(...filters))
      .orderBy(desc(persons.updatedAt), desc(persons.createdAt))
      .limit(limit);
    return rows.map(toPublicPerson);
  }

  // Name query: pull a broad candidate set with ILIKE, then rank in JS.
  const likeTerms = [norm, ...tokenize(norm).filter((t) => t.length >= 3)];
  const nameFilter = or(
    ...likeTerms.map((t) => ilike(persons.nameNormalized, `%${t}%`)),
    ilike(persons.fullName, `%${q}%`),
  )!;

  let candidates = await db
    .select()
    .from(persons)
    .where(and(...filters, nameFilter))
    .orderBy(desc(persons.createdAt))
    .limit(600);

  // Fallback for heavy typos that share no 3-gram token: rank recent records.
  if (candidates.length === 0) {
    candidates = await db
      .select()
      .from(persons)
      .where(and(...filters))
      .orderBy(desc(persons.createdAt))
      .limit(500);
  }

  const ranked = candidates
    .map((p) => ({ p, score: scoreName(norm, p.nameNormalized) }))
    .filter((r) => r.score >= MATCH_THRESHOLD)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.p.createdAt.getTime() - a.p.createdAt.getTime(),
    )
    .slice(0, limit);

  return ranked.map((r) => toPublicPerson(r.p));
}

export async function recentPersons(limit = 12): Promise<PublicPerson[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(persons)
    .where(eq(persons.moderationState, "published"))
    .orderBy(desc(persons.createdAt))
    .limit(limit);
  return rows.map(toPublicPerson);
}

export async function getPersonPublic(
  id: string,
): Promise<{ person: PublicPerson; notes: PublicNote[] } | null> {
  const db = await getDb();
  const [p] = await db.select().from(persons).where(eq(persons.id, id)).limit(1);
  if (!p || p.moderationState === "hidden") return null;

  const ns = await db
    .select()
    .from(notes)
    .where(and(eq(notes.personId, id), eq(notes.moderationState, "published")))
    .orderBy(desc(notes.createdAt));

  return { person: toPublicPerson(p), notes: ns.map(toPublicNote) };
}

export interface Stats {
  seeking: number;
  reunited: number;
  totalRecords: number;
  updatedToday: number;
}

export async function stats(): Promise<Stats> {
  const db = await getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      seeking: sql<number>`count(*) filter (where ${persons.status} = 'missing')::int`,
      reunited: sql<number>`count(*) filter (where ${persons.status} in ('safe','seen_alive'))::int`,
      totalRecords: sql<number>`count(*)::int`,
      updatedToday: sql<number>`count(*) filter (where ${persons.updatedAt} >= ${since})::int`,
    })
    .from(persons)
    .where(eq(persons.moderationState, "published"));

  return {
    seeking: row?.seeking ?? 0,
    reunited: row?.reunited ?? 0,
    totalRecords: row?.totalRecords ?? 0,
    updatedToday: row?.updatedToday ?? 0,
  };
}

// --- Moderation ---------------------------------------------------------------

export async function moderationQueue() {
  const db = await getDb();
  const pendingPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.moderationState, "pending"))
    .orderBy(desc(persons.createdAt))
    .limit(100);

  const pendingNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.moderationState, "pending"))
    .orderBy(desc(notes.createdAt))
    .limit(100);

  const openReports = await db
    .select()
    .from(abuseReports)
    .where(eq(abuseReports.resolved, false))
    .orderBy(desc(abuseReports.createdAt))
    .limit(100);

  return { pendingPersons, pendingNotes, openReports };
}

export async function setPersonModeration(
  id: string,
  state: Person["moderationState"],
) {
  const db = await getDb();
  await db
    .update(persons)
    .set({ moderationState: state, updatedAt: new Date() })
    .where(eq(persons.id, id));
}

export async function setNoteModeration(
  id: string,
  state: Note["moderationState"],
) {
  const db = await getDb();
  await db.update(notes).set({ moderationState: state }).where(eq(notes.id, id));
}

export async function resolveReport(id: string) {
  const db = await getDb();
  await db
    .update(abuseReports)
    .set({ resolved: true })
    .where(eq(abuseReports.id, id));
}

// --- PFIF export ------------------------------------------------------------

export async function allPublicForExport(since?: Date) {
  const db = await getDb();
  const where = since
    ? and(
        eq(persons.moderationState, "published"),
        gte(persons.updatedAt, since),
      )!
    : eq(persons.moderationState, "published");
  const ps = await db
    .select()
    .from(persons)
    .where(where)
    .orderBy(desc(persons.createdAt))
    .limit(5000);

  const ids = ps.map((p) => p.id);
  const ns = ids.length
    ? await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.moderationState, "published"),
            inArray(notes.personId, ids),
          ),
        )
    : [];

  return { persons: ps, notes: ns };
}

// --- Feed ingestion (official / partner sources) --------------------------

/**
 * Upsert a normalised record from an external feed. Keyed on
 * `import:<sourceId>:<externalId>` so re-running a feed updates in place.
 * These records are marked as a verified source and skip the moderation hold.
 */
export async function upsertImported(
  rec: NormalizedRecord,
  sourceId: string,
): Promise<"imported" | "updated"> {
  const db = await getDb();
  const key = `${sourceId}:${rec.externalId}`.slice(0, 300);
  const src = `import:${sourceId}`;

  const personValues = {
    recordType: rec.recordType,
    fullName: rec.fullName,
    nameNormalized: normalizeName(`${rec.fullName} ${rec.alsoKnownAs ?? ""}`),
    alsoKnownAs: rec.alsoKnownAs ?? null,
    ageYears: rec.ageYears ?? null,
    ageIsApprox: rec.ageIsApprox ?? false,
    sex: rec.sex ?? ("unknown" as const),
    nationality: rec.nationality ?? null,
    homeLocation: rec.homeLocation ?? null,
    lastSeenLocation: rec.lastSeenLocation ?? null,
    lastSeenAt: rec.lastSeenAt ?? null,
    description: rec.description ?? null,
    photoUrl: rec.photoUrl ?? null,
    status:
      rec.status ?? (rec.recordType === "seeking" ? "missing" : "unknown"),
    authorName: rec.authorName ?? null,
    authorIsVerified: true,
    source: src,
    moderationState: "published" as const,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(eq(persons.pfifRecordId, key))
    .limit(1);

  let personId: string;
  let outcome: "imported" | "updated";
  if (existing) {
    personId = existing.id;
    await db.update(persons).set(personValues).where(eq(persons.id, personId));
    outcome = "updated";
  } else {
    const [row] = await db
      .insert(persons)
      .values({
        ...personValues,
        pfifRecordId: key,
        editToken: randomUUID(),
        expiresAt: ttlDate(),
      })
      .returning({ id: persons.id });
    personId = row!.id;
    outcome = "imported";
  }

  for (const n of rec.notes ?? []) {
    const noteKey = `${sourceId}:${n.externalId}`.slice(0, 300);
    const noteValues = {
      personId,
      noteType: "general" as const,
      text: n.text,
      statusReported: n.status ?? null,
      lastKnownLocation: n.lastKnownLocation ?? null,
      authorName: n.authorName ?? null,
      authorIsVerified: true,
      source: src,
      moderationState: "published" as const,
      pfifNoteId: noteKey,
      createdAt: n.createdAt ?? undefined,
    };
    const [exN] = await db
      .select({ id: notes.id })
      .from(notes)
      .where(eq(notes.pfifNoteId, noteKey))
      .limit(1);
    if (exN) {
      await db.update(notes).set(noteValues).where(eq(notes.id, exN.id));
    } else {
      await db.insert(notes).values(noteValues);
    }
  }

  return outcome;
}

export async function recordCountSince(minutes: number): Promise<number> {
  const db = await getDb();
  const since = new Date(Date.now() - minutes * 60_000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(persons)
    .where(gte(persons.createdAt, since));
  return row?.n ?? 0;
}

// --- Live-update version stamps -------------------------------------------
// Each is a short string that changes iff something a viewer would care about
// changed. Clients poll these and call router.refresh() when the value moves.

/** Version for a single record page (header + status + sightings timeline). */
export async function personVersion(id: string): Promise<string | null> {
  const db = await getDb();
  const [p] = await db
    .select({
      updatedAt: persons.updatedAt,
      moderationState: persons.moderationState,
    })
    .from(persons)
    .where(eq(persons.id, id))
    .limit(1);
  if (!p) return null;

  const [n] = await db
    .select({
      count: sql<number>`count(*)::int`,
      latest: sql<string | null>`max(${notes.createdAt})`,
    })
    .from(notes)
    .where(and(eq(notes.personId, id), eq(notes.moderationState, "published")));

  return [
    p.updatedAt.toISOString(),
    p.moderationState,
    n?.count ?? 0,
    n?.latest ?? "",
  ].join("|");
}

/** Version for the public feed: home "recently added", counters, search list. */
export async function feedVersion(): Promise<string> {
  const db = await getDb();
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      maxUpdated: sql<string | null>`max(${persons.updatedAt})`,
    })
    .from(persons)
    .where(eq(persons.moderationState, "published"));
  return [row?.count ?? 0, row?.maxUpdated ?? ""].join("|");
}

/** Version for the moderation queue (pending records/notes + open reports). */
export async function moderationVersion(): Promise<string> {
  const db = await getDb();
  const [p] = await db
    .select({ c: sql<number>`count(*)::int`, m: sql<string | null>`max(${persons.createdAt})` })
    .from(persons)
    .where(eq(persons.moderationState, "pending"));
  const [n] = await db
    .select({ c: sql<number>`count(*)::int`, m: sql<string | null>`max(${notes.createdAt})` })
    .from(notes)
    .where(eq(notes.moderationState, "pending"));
  const [r] = await db
    .select({ c: sql<number>`count(*)::int`, m: sql<string | null>`max(${abuseReports.createdAt})` })
    .from(abuseReports)
    .where(eq(abuseReports.resolved, false));
  return [
    p?.c ?? 0,
    p?.m ?? "",
    n?.c ?? 0,
    n?.m ?? "",
    r?.c ?? 0,
    r?.m ?? "",
  ].join("|");
}
