import type { ReactNode } from "react";

const TONES = {
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
    icon: "text-sky-600 dark:text-sky-400",
    path: "M10 13a1 1 0 0 1-1-1V9a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1Zm0-6.5A1.25 1.25 0 1 1 10 4a1.25 1.25 0 0 1 0 2.5Z",
  },
  warn: {
    box: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    path: "M10 3.5a1 1 0 0 1 .87.5l6.5 11.25A1 1 0 0 1 16.5 17h-13a1 1 0 0 1-.87-1.5L9.13 4a1 1 0 0 1 .87-.5Zm0 4a.9.9 0 0 0-.9.98l.3 3.2a.6.6 0 0 0 1.2 0l.3-3.2A.9.9 0 0 0 10 7.5Zm0 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
    path: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm3.4 5.9-4 4a1 1 0 0 1-1.42 0l-1.8-1.8a1 1 0 0 1 1.42-1.42l1.09 1.1 3.29-3.3a1 1 0 0 1 1.42 1.42Z",
  },
  danger: {
    box: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
    icon: "text-rose-600 dark:text-rose-400",
    path: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM9 6a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V6Zm1 9.25A1.25 1.25 0 1 1 10 12.75a1.25 1.25 0 0 1 0 2.5Z",
  },
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
  const t = TONES[tone];
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3.5 text-sm ${t.box}`}>
      <svg viewBox="0 0 20 20" className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} aria-hidden>
        <path d={t.path} fill="currentColor" />
      </svg>
      <div>
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
