"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "live" | "slow" | "stopped";

/**
 * Keeps a server-rendered page fresh without a manual reload.
 *
 * Every `intervalMs` it fetches a tiny version string from `src`. When the value
 * changes it calls router.refresh(), which re-runs the server component and
 * streams in the new data. While the tab is in the background it keeps checking
 * at a slower cadence and snaps back to full speed on focus. Backs off on
 * errors. All data still comes from the sanitised server render - this only
 * decides *when* to re-fetch.
 *
 * Give it `key={src}` at the call site so route changes remount it cleanly.
 */
export function LiveRefresh({
  src,
  initialVersion,
  intervalMs = 10_000,
  label = "Live",
  className = "",
}: {
  src: string;
  initialVersion: string | null;
  intervalMs?: number;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const version = useRef<string | null>(initialVersion);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(0);
  const stopped = useRef(false);
  const [phase, setPhase] = useState<Phase>("live");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    version.current = initialVersion;
    stopped.current = false;

    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    const schedule = (ms: number) => {
      clear();
      timer.current = setTimeout(run, ms + Math.random() * 800);
    };

    async function run() {
      if (cancelled || stopped.current) return;
      const hidden = document.visibilityState === "hidden";
      setPhase(hidden ? "slow" : "live");

      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(src, { cache: "no-store", signal: ctrl.signal });
        clearTimeout(to);
        if (res.status === 403) {
          stopped.current = true;
          setPhase("stopped");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { v: string | null };
        backoff.current = 0;

        if (data.v != null) {
          if (version.current == null) {
            version.current = data.v;
          } else if (data.v !== version.current) {
            version.current = data.v;
            setFlash(true);
            setTimeout(() => !cancelled && setFlash(false), 3500);
            router.refresh();
          }
        }
        if (!cancelled) schedule(hidden ? intervalMs * 2 : intervalMs);
      } catch {
        clearTimeout(to);
        backoff.current = Math.min(
          backoff.current ? backoff.current * 2 : intervalMs,
          60_000,
        );
        if (!cancelled) schedule(backoff.current);
      }
    }

    const wake = () => {
      if (!stopped.current && !cancelled) schedule(0);
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    schedule(intervalMs);

    return () => {
      cancelled = true;
      clear();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, intervalMs, initialVersion]);

  if (phase === "stopped") return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-muted ${className}`}
      title="This page updates automatically"
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          flash
            ? "bg-accent"
            : phase === "live"
              ? "bg-emerald-500 motion-safe:animate-pulse"
              : "bg-slate-400"
        }`}
      />
      <span aria-live="polite">{flash ? "Updated just now" : label}</span>
    </span>
  );
}
