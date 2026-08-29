/**
 * Pull the configured event-update feeds now. Run on a schedule for a livelier
 * stream than the on-page-load refresh:
 *
 *   npm run updates:pull
 */
import "@/db/load-env";
import { refreshUpdates } from "@/lib/updates";
import { enabledUpdateFeeds } from "@/config/update-feeds";

async function main() {
  const feeds = enabledUpdateFeeds();
  console.log(`Feeds enabled: ${feeds.map((f) => f.id).join(", ") || "(none)"}`);
  const r = await refreshUpdates();
  console.log(
    `fetched ${r.fetched}, inserted ${r.inserted}, skipped ${r.skipped}` +
      (r.errors.length ? `\nerrors:\n  ${r.errors.join("\n  ")}` : ""),
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
