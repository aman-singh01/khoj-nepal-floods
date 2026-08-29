import { STATUS_LABELS } from "@/lib/ui";

const STYLES: Record<string, { wrap: string; dot: string }> = {
  missing: {
    wrap: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
  seen_alive: {
    wrap: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-400/20",
    dot: "bg-sky-500",
  },
  safe: {
    wrap: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  injured: {
    wrap: "bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-400/20",
    dot: "bg-orange-500",
  },
  deceased: {
    wrap: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-400/20",
    dot: "bg-slate-500",
  },
  unknown: {
    wrap: "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? STYLES.unknown;
  return (
    <span className={`badge ${s.wrap}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  );
}
