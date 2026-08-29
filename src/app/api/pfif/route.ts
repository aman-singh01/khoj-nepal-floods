import { allPublicForExport } from "@/lib/repo";
import { toPfifDocument } from "@/lib/pfif";

export const dynamic = "force-dynamic";

/**
 * PFIF 1.4 feed of every published record. Intended for import by other
 * missing-person trackers and by the Red Cross. Public but not indexed.
 */
export async function GET() {
  const { persons, notes } = await allPublicForExport();
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
