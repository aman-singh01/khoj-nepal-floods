import { moderationVersion } from "@/lib/repo";
import { isModerator } from "@/lib/moderation-auth";

export const dynamic = "force-dynamic";

/** Polled by the moderation queue. Requires a moderator cookie. */
export async function GET() {
  if (!(await isModerator())) {
    return Response.json({ error: "unauthorised" }, { status: 403 });
  }
  try {
    const v = await moderationVersion();
    return Response.json({ v }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ v: null }, { status: 200 });
  }
}
