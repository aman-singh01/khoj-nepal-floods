/**
 * Pull everything now, then every INTERVAL_HOURS (default 6): the event-update
 * feeds AND the enabled person-record feeds. A no-frills alternative to cron for
 * local dev or a VPS:
 *
 *   npm run data:watch
 *   INTERVAL_HOURS=3 npm run data:watch
 */
import "@/db/load-env";
import { refreshUpdates } from "@/lib/updates";
import { ingestFeed } from "@/lib/feeds";
import { enabledFeeds } from "@/config/official-sources";

const hours = Math.max(0.25, Number(process.env.INTERVAL_HOURS || "6"));
const intervalMs = hours * 3_600_000;

async function tick() {
  const at = new Date().toISOString();
  try {
    const u = await refreshUpdates();
    console.log(
      `${at}  updates: fetched ${u.fetched}, +${u.inserted}` +
        (u.errors.length ? ` (${u.errors.length} errors)` : ""),
    );
  } catch (e) {
    console.error(`${at}  updates failed:`, (e as Error).message);
  }
  for (const feed of enabledFeeds()) {
    try {
      const r = await ingestFeed(feed);
      console.log(
        `${at}  ${feed.id}: +${r.imported} new, ${r.updated} updated, ` +
          `${r.reconcileGrace} flagged-missing, ${r.reconcileHeld} held` +
          (r.errors.length ? ` (${r.errors.length} errors)` : ""),
      );
    } catch (e) {
      console.error(`${at}  ${feed.id} failed:`, (e as Error).message);
    }
  }
}

async function main() {
  console.log(`Watching updates + feeds every ${hours}h. Ctrl+C to stop.`);
  await tick();
  setInterval(tick, intervalMs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
