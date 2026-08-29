import { tokenValid, isModerator } from "@/lib/moderation-auth";
import { refreshUpdates } from "@/lib/updates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorised(req: Request): Promise<boolean> {
  const header =
    req.headers.get("x-khoj-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (tokenValid(header)) return true;
  // Vercel Cron sends this header.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && header === cronSecret) return true;
  return isModerator();
}

/** Pull the configured news / humanitarian feeds now. For cron or a moderator. */
export async function POST(req: Request) {
  if (!(await authorised(req))) {
    return Response.json({ error: "unauthorised" }, { status: 403 });
  }
  const result = await refreshUpdates();
  return Response.json(result);
}

// Vercel Cron issues GET; accept it too.
export async function GET(req: Request) {
  return POST(req);
}
