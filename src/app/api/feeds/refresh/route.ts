import { tokenValid, isModerator } from "@/lib/moderation-auth";
import { ingestFeed } from "@/lib/feeds";
import { enabledFeeds } from "@/config/official-sources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorised(req: Request): Promise<boolean> {
  const header =
    req.headers.get("x-khoj-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (tokenValid(header)) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && header === cronSecret) return true;
  return isModerator();
}

/** Pull every enabled person-record feed now. For cron or a moderator. */
export async function POST(req: Request) {
  if (!(await authorised(req))) {
    return Response.json({ error: "unauthorised" }, { status: 403 });
  }
  const feeds = enabledFeeds();
  const results = [];
  for (const feed of feeds) results.push(await ingestFeed(feed));
  return Response.json({ feeds: feeds.length, results });
}

export async function GET(req: Request) {
  return POST(req);
}
