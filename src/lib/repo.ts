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
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    expiresAt: p.expiresAt.toISOString(),
  };
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

export async function allPublicForExport() {
  const db = await getDb();
  const ps = await db
    .select()
    .from(persons)
    .where(eq(persons.moderationState, "published"))
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

export async function recordCountSince(minutes: number): Promise<number> {
  const db = await getDb();
  const since = new Date(Date.now() - minutes * 60_000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(persons)
    .where(gte(persons.createdAt, since));
  return row?.n ?? 0;
}
