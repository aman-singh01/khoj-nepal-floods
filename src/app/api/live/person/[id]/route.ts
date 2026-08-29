import { personVersion } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Tiny endpoint the record page polls to know when to refresh. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let v: string | null = null;
  try {
    v = await personVersion(id);
  } catch {
    return Response.json({ v: null }, { status: 200 });
  }
  if (v === null) return Response.json({ v: null }, { status: 404 });
  return Response.json(
    { v },
    { headers: { "cache-control": "no-store" } },
  );
}
