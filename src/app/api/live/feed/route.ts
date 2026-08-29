import { feedVersion } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Polled by the home feed, counters, and search results. */
export async function GET() {
  try {
    const v = await feedVersion();
    return Response.json({ v }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ v: null }, { status: 200 });
  }
}
