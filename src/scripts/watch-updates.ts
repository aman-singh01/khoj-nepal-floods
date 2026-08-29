/**
 * Pull the event-update feeds now and then every INTERVAL_HOURS (default 6).
 * A no-frills alternative to cron for local dev or a VPS:
 *
 *   npm run updates:watch
 *   INTERVAL_HOURS=3 npm run updates:watch
 */
import "@/db/load-env";
import { refreshUpdates } from "@/lib/updates";

const hours = Math.max(0.25, Number(process.env.INTERVAL_HOURS || "6"));
const intervalMs = hours * 3_600_000;

async function tick() {
  const at = new Date().toISOString();
  try {
    const r = await refreshUpdates();
    console.log(
      `${at}  fetched ${r.fetched}, inserted ${r.inserted}, skipped ${r.skipped}` +
        (r.errors.length ? `  errors: ${r.errors.length}` : ""),
    );
  } catch (e) {
    console.error(`${at}  refresh failed:`, (e as Error).message);
  }
}

async function main() {
  console.log(`Watching event feeds every ${hours}h. Ctrl+C to stop.`);
  await tick();
  setInterval(tick, intervalMs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
