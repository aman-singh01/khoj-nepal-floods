import { updatesVersion } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Polled by the /updates page and the home "Latest updates" card. */
export async function GET() {
  try {
    const v = await updatesVersion();
    return Response.json({ v }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ v: null }, { status: 200 });
  }
}
