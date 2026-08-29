import { allPublicForExport } from "@/lib/repo";
import { toPfifDocument } from "@/lib/pfif";

export const dynamic = "force-dynamic";

/**
 * PFIF 1.4 feed of every published record. Intended for import by other
 * missing-person trackers and by the Red Cross. Public but not indexed.
 *
 * `?since=2026-08-29T00:00:00Z` returns only records updated since that time
 * (for agencies pulling deltas).
 */
export async function GET(req: Request) {
  const sinceRaw = new URL(req.url).searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : undefined;
  if (since && Number.isNaN(since.getTime())) {
    return Response.json({ error: "invalid since" }, { status: 400 });
  }

  const { persons, notes } = await allPublicForExport(since);
  const xml = toPfifDocument(persons, notes);
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "content-disposition": 'inline; filename="khoj-pfif.xml"',
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
