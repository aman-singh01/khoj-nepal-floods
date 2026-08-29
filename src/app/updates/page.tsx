import type { Metadata } from "next";
import Link from "next/link";
import { UpdateList } from "@/components/UpdateList";
import { LiveRefresh } from "@/components/LiveRefresh";
import { SetupNotice } from "@/components/SetupNotice";
import { recentUpdates, updatesVersion, type PublicUpdate } from "@/lib/repo";
import { refreshUpdatesIfStale } from "@/lib/updates";
import { EVENT } from "@/config/official-sources";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Updates" };

type SP = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { key: "", label: "All" },
  { key: "official", label: "Official" },
  { key: "humanitarian", label: "Humanitarian" },
  { key: "news", label: "News" },
] as const;

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const trustRaw = Array.isArray(sp.trust) ? sp.trust[0] : sp.trust;
  const trust =
    trustRaw === "official" || trustRaw === "humanitarian" || trustRaw === "news"
      ? trustRaw
      : undefined;

  await refreshUpdatesIfStale();

  let updates: PublicUpdate[] | null = null;
  let version: string | null = null;
  let error: unknown = null;
  try {
    [updates, version] = await Promise.all([
      recentUpdates({ trust, limit: 120 }),
      updatesVersion(),
    ]);
  } catch (e) {
    error = e;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold">Updates</h1>
        <LiveRefresh
          key="/api/live/updates"
          src="/api/live/updates"
          initialVersion={version}
        />
      </div>

      <p className="text-muted">
        Live coverage of the {EVENT.name} ({EVENT.date}), gathered from news and
        humanitarian sources. Every item links to its origin.
      </p>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (trust ?? "") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/updates?trust=${t.key}` : "/updates"}
              className={`rounded-full border px-3 py-1 text-sm ${
                active
                  ? "border-accent bg-accent-weak font-medium text-accent-strong"
                  : "border-border text-muted hover:border-border-strong"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {error ? <SetupNotice error={error} /> : null}
      {updates && <UpdateList updates={updates} />}
    </div>
  );
}
