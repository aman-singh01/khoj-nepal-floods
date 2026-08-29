import { XMLParser } from "fast-xml-parser";
import type { NormalizedRecord, NormalizedNote } from "./types";
import type { STATUSES } from "@/lib/validation";

type Status = (typeof STATUSES)[number];

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  trimValues: true,
  isArray: (name) => name === "person" || name === "note",
});

function text(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function parseAge(v: unknown): { age?: number; approx?: boolean } {
  const s = text(v);
  if (!s) return {};
  const range = s.match(/^(\d{1,3})\s*-\s*(\d{1,3})$/);
  if (range) {
    return {
      age: Math.round((Number(range[1]) + Number(range[2])) / 2),
      approx: true,
    };
  }
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 130 ? { age: n } : {};
}

function statusFromPfif(v: unknown): {
  status?: Status;
  recordType?: "seeking" | "info";
} {
  switch (text(v)) {
    case "information_sought":
      return { status: "missing", recordType: "seeking" };
    case "believed_missing":
      return { status: "missing", recordType: "seeking" };
    case "believed_alive":
      return { status: "seen_alive", recordType: "info" };
    case "believed_dead":
      return { status: "deceased", recordType: "info" };
    default:
      return {};
  }
}

function parseDate(v: unknown): Date | undefined {
  const s = text(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Parse a PFIF 1.3/1.4 document into normalised records. */
export function parsePfif(xml: string): NormalizedRecord[] {
  const doc = parser.parse(xml);
  const root = doc.pfif ?? doc;
  const persons: Record<string, unknown>[] = Array.isArray(root?.person)
    ? root.person
    : [];

  const out: NormalizedRecord[] = [];

  for (const p of persons) {
    const fullName =
      text(p.full_name) ??
      [text(p.first_name) ?? text(p.given_name), text(p.last_name) ?? text(p.family_name)]
        .filter(Boolean)
        .join(" ");
    if (!fullName) continue;

    const rawNotes: Record<string, unknown>[] = Array.isArray(p.note)
      ? (p.note as Record<string, unknown>[])
      : p.note
        ? [p.note as Record<string, unknown>]
        : [];

    // Derive the person's headline status/type from the most decisive note.
    let status: Status | undefined;
    let recordType: "seeking" | "info" = "seeking";
    for (const n of rawNotes) {
      const s = statusFromPfif(n.status);
      if (s.status) {
        status = s.status;
        recordType = s.recordType ?? recordType;
      }
    }

    const { age, approx } = parseAge(p.age);
    const sexRaw = text(p.sex)?.toLowerCase();

    const notes: NormalizedNote[] = [];
    rawNotes.forEach((n, i) => {
      const t = text(n.text);
      if (!t) return;
      notes.push({
        externalId:
          text(n.note_record_id) ?? `${text(p.person_record_id)}#${i}`,
        text: t,
        status: statusFromPfif(n.status).status,
        lastKnownLocation: text(n.last_known_location),
        authorName: text(n.author_name),
        createdAt: parseDate(n.entry_date ?? n.source_date),
      });
    });

    out.push({
      externalId: text(p.person_record_id) ?? fullName,
      recordType,
      fullName,
      alsoKnownAs: text(p.alternate_names),
      ageYears: age,
      ageIsApprox: approx,
      sex:
        sexRaw === "female" || sexRaw === "male" || sexRaw === "other"
          ? sexRaw
          : undefined,
      nationality: text(p.home_country),
      homeLocation: [text(p.home_city), text(p.home_state)].filter(Boolean).join(", ") || undefined,
      description: text(p.description),
      photoUrl: text(p.photo_url),
      status,
      authorName: text(p.author_name) ?? text(p.source_name),
      notes,
    });
  }

  return out;
}
