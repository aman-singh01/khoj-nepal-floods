import type { ReactNode } from "react";

const TONES = {
  info: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100",
  warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
  danger:
    "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100",
};

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
