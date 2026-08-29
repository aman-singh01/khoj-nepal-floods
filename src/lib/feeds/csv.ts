import { STATUSES } from "@/lib/validation";
import type { NormalizedRecord } from "./types";

/** RFC-4180-ish CSV parse: handles quoted fields, embedded commas/newlines, "" escapes. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = input.replace(/\r\n?/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length));
}

const STATUS_SET = new Set<string>(STATUSES);

function coerceStatus(v: string | undefined): NormalizedRecord["status"] {
  if (!v) return undefined;
  const k = v.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return STATUS_SET.has(k) ? (k as NormalizedRecord["status"]) : undefined;
}

/**
 * Map CSV rows to normalised records using `mapping` (our field name -> CSV
 * column header). `externalId` mapping is required for idempotent upserts.
 */
export function csvToRecords(
  csv: string,
  mapping: Record<string, string>,
): NormalizedRecord[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (col: string) => header.indexOf(col);

  const get = (r: string[], key: string): string | undefined => {
    const col = mapping[key];
    if (!col) return undefined;
    const i = idx(col);
    if (i < 0) return undefined;
    const v = r[i]?.trim();
    return v && v.length ? v : undefined;
  };

  const out: NormalizedRecord[] = [];
  for (const r of rows.slice(1)) {
    const fullName = get(r, "fullName");
    if (!fullName) continue;

    // Drop rows the source marks as removed / deleted / withdrawn / spam.
    const rawStatus = get(r, "status")?.toLowerCase() ?? "";
    if (/\b(remov|delet|withdraw|spam|reject)/.test(rawStatus)) continue;

    const ageRaw = get(r, "ageYears");
    const age = ageRaw ? Number(ageRaw.replace(/[^\d]/g, "")) : undefined;
    const sexRaw = get(r, "sex")?.toLowerCase();

    // "missing" / "seeking" -> a family is looking; anything else -> information.
    const rt = (get(r, "recordType") ?? "").toLowerCase();
    const recordType: NormalizedRecord["recordType"] =
      rt.includes("miss") || rt.includes("seek") ? "seeking" : "info";

    const status: NormalizedRecord["status"] =
      recordType === "seeking"
        ? "missing"
        : (coerceStatus(get(r, "status")) ?? "safe");

    const unverifiedRaw = get(r, "unverified")?.toLowerCase();
    const unverified =
      unverifiedRaw === "true" || unverifiedRaw === "1" || unverifiedRaw === "yes";

    out.push({
      externalId: get(r, "externalId") ?? fullName,
      recordType,
      fullName,
      ageYears: Number.isFinite(age) && age! > 0 && age! < 130 ? age : undefined,
      ageIsApprox: age != null,
      sex:
        sexRaw === "female" || sexRaw === "male" || sexRaw === "other"
          ? sexRaw
          : undefined,
      nationality: get(r, "nationality"),
      homeLocation: get(r, "homeLocation"),
      lastSeenLocation: get(r, "lastSeenLocation"),
      lastSeenAt: parseFeedDate(get(r, "lastSeenAt")),
      description: get(r, "description"),
      status,
      authorName: get(r, "authorName"),
      unverified: mapping.unverified ? unverified : undefined,
    });
  }
  return out;
}

function parseFeedDate(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
