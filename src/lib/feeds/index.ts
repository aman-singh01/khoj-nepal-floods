import { parsePfif } from "./pfif";
import { csvToRecords } from "./csv";
import { upsertImported, reconcileImported } from "@/lib/repo";
import type { OfficialSource } from "@/config/official-sources";
import type { IngestResult, NormalizedRecord } from "./types";

const MAX_BYTES = 8 * 1024 * 1024;

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "Khoj-feed-puller/1.0" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("feed too large");
    return new TextDecoder().decode(buf);
  } finally {
    clearTimeout(to);
  }
}

function jsonToRecords(
  raw: string,
  mapping: Record<string, string>,
): NormalizedRecord[] {
  const data = JSON.parse(raw);
  const rows: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.records)
      ? data.records
      : [];
  const pick = (r: Record<string, unknown>, k: string) => {
    const key = mapping[k];
    const v = key ? r[key] : undefined;
    return v == null ? undefined : String(v).trim() || undefined;
  };
  return rows
    .map((r): NormalizedRecord | null => {
      const fullName = pick(r, "fullName");
      if (!fullName) return null;
      const age = Number(pick(r, "ageYears"));
      return {
        externalId: pick(r, "externalId") ?? fullName,
        recordType: "info",
        fullName,
        ageYears: Number.isFinite(age) && age > 0 && age < 130 ? age : undefined,
        nationality: pick(r, "nationality"),
        lastSeenLocation: pick(r, "lastSeenLocation"),
        description: pick(r, "description"),
        status: "safe",
        authorName: pick(r, "authorName"),
      };
    })
    .filter((r): r is NormalizedRecord => r !== null);
}

export function recordsFromPayload(
  payload: string,
  format: OfficialSource["feedFormat"],
  mapping: Record<string, string> = {},
): NormalizedRecord[] {
  switch (format) {
    case "pfif":
      return parsePfif(payload);
    case "csv":
      return csvToRecords(payload, mapping);
    case "json":
      return jsonToRecords(payload, mapping);
    default:
      throw new Error(`unsupported feed format: ${format}`);
  }
}

/** Ingest already-fetched content (used by the POST /api/pfif/import endpoint). */
export async function ingestPayload(
  sourceId: string,
  payload: string,
  format: OfficialSource["feedFormat"],
  mapping: Record<string, string> = {},
): Promise<IngestResult> {
  const result: IngestResult = {
    sourceId,
    imported: 0,
    updated: 0,
    skipped: 0,
    reconcileGrace: 0,
    reconcileHeld: 0,
    errors: [],
  };
  let records: NormalizedRecord[];
  try {
    records = recordsFromPayload(payload, format, mapping);
  } catch (e) {
    result.errors.push(`parse failed: ${(e as Error).message}`);
    return result;
  }

  const seen = new Set<string>();
  for (const rec of records) {
    seen.add(rec.externalId);
    try {
      const outcome = await upsertImported(rec, sourceId);
      if (outcome === "imported") result.imported++;
      else result.updated++;
    } catch (e) {
      result.skipped++;
      result.errors.push(`${rec.fullName}: ${(e as Error).message}`);
    }
  }

  try {
    const rec = await reconcileImported(sourceId, seen, records.length);
    result.reconcileGrace = rec.gracePeriodStarted;
    result.reconcileHeld = rec.heldForReview;
    if (rec.skipped) {
      result.errors.push("reconciliation skipped — feed looked truncated");
    }
  } catch (e) {
    result.errors.push(`reconcile failed: ${(e as Error).message}`);
  }

  return result;
}

const emptyResult = (sourceId: string, error: string): IngestResult => ({
  sourceId,
  imported: 0,
  updated: 0,
  skipped: 0,
  reconcileGrace: 0,
  reconcileHeld: 0,
  errors: [error],
});

/** Pull and ingest one configured feed source. */
export async function ingestFeed(source: OfficialSource): Promise<IngestResult> {
  if (source.kind !== "feed" || !source.url || !source.feedFormat) {
    return emptyResult(source.id, "source is not a configured feed");
  }
  let payload: string;
  try {
    payload = await fetchText(source.url);
  } catch (e) {
    return emptyResult(source.id, `fetch failed: ${(e as Error).message}`);
  }
  return ingestPayload(
    source.id,
    payload,
    source.feedFormat,
    source.feedMapping ?? {},
  );
}
