/**
 * Pull every enabled feed in src/config/official-sources.ts and merge the
 * records into Khoj. Run on a schedule (cron / GitHub Actions / Vercel Cron):
 *
 *   npm run feeds:pull
 *
 * Feeds are disabled by default; nothing happens until the operator sets a real
 * URL and `enabled: true` on a source.
 */
import "@/db/load-env";
import { enabledFeeds } from "@/config/official-sources";
import { ingestFeed } from "@/lib/feeds";

async function main() {
  const feeds = enabledFeeds();
  if (feeds.length === 0) {
    console.log("No enabled feeds. Configure one in src/config/official-sources.ts.");
    return;
  }
  for (const feed of feeds) {
    process.stdout.write(`Pulling ${feed.id} (${feed.name}) … `);
    const r = await ingestFeed(feed);
    console.log(
      `imported ${r.imported}, updated ${r.updated}, skipped ${r.skipped}` +
        (r.errors.length ? `, errors: ${r.errors.slice(0, 3).join("; ")}` : ""),
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
