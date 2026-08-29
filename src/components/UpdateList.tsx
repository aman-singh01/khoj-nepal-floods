import type { PublicUpdate } from "@/lib/repo";
import { relativeTime } from "@/lib/ui";

const TRUST_STYLE: Record<string, { label: string; cls: string }> = {
  official: {
    label: "Official",
    cls: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-400/20",
  },
  humanitarian: {
    label: "Humanitarian",
    cls: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-400/20",
  },
  news: {
    label: "News",
    cls: "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15",
  },
};

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function UpdateRow({ u }: { u: PublicUpdate }) {
  const t = TRUST_STYLE[u.trust] ?? TRUST_STYLE.news;
  return (
    <li className="rounded-xl border border-border bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {u.pinned && (
          <span className="badge bg-accent-weak text-accent-strong ring-accent/20">
            📌 pinned
          </span>
        )}
        <span className={`badge ${t.cls}`}>{t.label}</span>
        <span className="font-medium text-muted">{u.source}</span>
        <span className="text-muted">· {relativeTime(u.publishedAt)}</span>
      </div>
      <a
        href={u.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 block font-medium hover:text-accent-strong hover:underline"
      >
        {u.title} <span aria-hidden>↗</span>
      </a>
      {u.summary && (
        <p className="mt-1 line-clamp-3 text-sm text-muted">{u.summary}</p>
      )}
    </li>
  );
}

export function UpdateList({
  updates,
  grouped = true,
}: {
  updates: PublicUpdate[];
  grouped?: boolean;
}) {
  if (updates.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
        No updates collected yet.
      </p>
    );
  }

  if (!grouped) {
    return (
      <ul className="space-y-2">
        {updates.map((u) => (
          <UpdateRow key={u.id} u={u} />
        ))}
      </ul>
    );
  }

  const pinned = updates.filter((u) => u.pinned);
  const rest = updates.filter((u) => !u.pinned);
  const days = new Map<string, PublicUpdate[]>();
  for (const u of rest) {
    const k = dayKey(u.publishedAt);
    let arr = days.get(k);
    if (!arr) {
      arr = [];
      days.set(k, arr);
    }
    arr.push(u);
  }

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <ul className="space-y-2">
          {pinned.map((u) => (
            <UpdateRow key={u.id} u={u} />
          ))}
        </ul>
      )}
      {[...days.entries()].map(([day, items]) => (
        <section key={day} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {day}
          </h3>
          <ul className="space-y-2">
            {items.map((u) => (
              <UpdateRow key={u.id} u={u} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
