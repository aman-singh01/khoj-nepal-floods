import { STATUS_LABELS } from "./validation";
import type { PublicPerson } from "./repo";

export { STATUS_LABELS };

export const STATUS_CLASSES: Record<string, string> = {
  missing: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  seen_alive:
    "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  safe: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  injured:
    "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  deceased: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  unknown: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function formatAge(p: Pick<PublicPerson, "ageYears" | "ageIsApprox">): string | null {
  if (p.ageYears == null) return null;
  return `${p.ageIsApprox ? "~" : ""}${p.ageYears} yrs`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  const table: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [2592000, "day"],
    [31536000, "month"],
    [Infinity, "year"],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let unitSecs = 1;
  for (const [limit, unit] of table) {
    if (Math.abs(secs) < limit) {
      const value = Math.round(secs / unitSecs);
      return rtf.format(-value, unit);
    }
    unitSecs = limit;
  }
  return new Date(iso).toLocaleDateString();
}

export function personSummaryLine(p: PublicPerson): string {
  return [
    formatAge(p),
    p.sex !== "unknown" ? p.sex : null,
    p.nationality,
    p.lastSeenLocation ? `last seen ${p.lastSeenLocation}` : p.homeLocation,
  ]
    .filter(Boolean)
    .join(" · ");
}
