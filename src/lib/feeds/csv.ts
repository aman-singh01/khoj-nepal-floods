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
    const ageRaw = get(r, "ageYears");
    const age = ageRaw ? Number(ageRaw.replace(/[^\d]/g, "")) : undefined;
    const sexRaw = get(r, "sex")?.toLowerCase();

    out.push({
      externalId: get(r, "externalId") ?? fullName,
      recordType: "info", // camp rosters describe people who are accounted for
      fullName,
      ageYears: Number.isFinite(age) && age! > 0 && age! < 130 ? age : undefined,
      sex:
        sexRaw === "female" || sexRaw === "male" || sexRaw === "other"
          ? sexRaw
          : undefined,
      nationality: get(r, "nationality"),
      homeLocation: get(r, "homeLocation"),
      lastSeenLocation: get(r, "lastSeenLocation"),
      description: get(r, "description"),
      status: coerceStatus(get(r, "status")) ?? "safe",
      authorName: get(r, "authorName"),
    });
  }
  return out;
}
