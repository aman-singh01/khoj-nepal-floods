import {
  enabledUpdateFeeds,
  UPDATES_TTL_MINUTES,
  type UpdateFeed,
} from "@/config/update-feeds";
import { upsertUpdate, lastUpdateFetch } from "@/lib/repo";
import { parseFeed, splitGoogleNewsTitle } from "./rss";
import { fetchReliefWeb } from "./reliefweb";
import type { NormalizedUpdate, RefreshResult } from "./types";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_AGE_DAYS = 30;

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; Khoj-finder/1.0; +updates)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("feed too large");
    return new TextDecoder().decode(buf);
  } finally {
    clearTimeout(to);
  }
}

function matchesFilter(u: NormalizedUpdate, terms?: string[]): boolean {
  if (!terms || terms.length === 0) return true;
  const hay = `${u.title} ${u.summary ?? ""}`.toLowerCase();
  return terms.some((t) => hay.includes(t.toLowerCase()));
}

async function collectFeed(feed: UpdateFeed): Promise<NormalizedUpdate[]> {
  if (feed.kind === "reliefweb") {
    return fetchReliefWeb(feed.reliefwebAppname!, feed.id);
  }

  const xml = await fetchText(feed.url);
  const items = parseFeed(xml);
  const out: NormalizedUpdate[] = [];

  for (const it of items) {
    if (!it.title || !it.link) continue;
    let title = it.title;
    let source = it.source;
    if (feed.kind === "gnews") {
      const split = splitGoogleNewsTitle(title);
      title = split.title;
      source = source ?? split.source;
    }
    // Trim verbose feed titles like "UN News - Global perspective Human stories".
    if (source && source.length > 28) source = source.split(/\s+[-–—]\s+/)[0].trim();

    // Google News descriptions just echo the headline — drop those.
    let summary = it.summary;
    if (summary) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (norm(summary).includes(norm(title).slice(0, 40))) summary = undefined;
    }

    out.push({
      feed: feed.id,
      source: source ?? feed.name,
      trust: feed.trust,
      title,
      summary,
      url: it.link,
      publishedAt: it.publishedAt ?? new Date(),
    });
  }
  return out;
}

/** Pull every enabled feed and store new items. Safe to call often. */
export async function refreshUpdates(): Promise<RefreshResult> {
  const result: RefreshResult = {
    fetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  };
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;

  for (const feed of enabledUpdateFeeds()) {
    let items: NormalizedUpdate[];
    try {
      items = await collectFeed(feed);
    } catch (e) {
      result.errors.push(`${feed.id}: ${(e as Error).message}`);
      continue;
    }

    for (const u of items) {
      result.fetched++;
      if (
        !matchesFilter(u, feed.filter) ||
        u.publishedAt.getTime() < cutoff ||
        Number.isNaN(u.publishedAt.getTime())
      ) {
        result.skipped++;
        continue;
      }
      try {
        const isNew = await upsertUpdate(u);
        if (isNew) result.inserted++;
        else result.skipped++;
      } catch (e) {
        result.errors.push(`${feed.id} "${u.title.slice(0, 40)}": ${(e as Error).message}`);
      }
    }
  }
  return result;
}

let inFlight: Promise<RefreshResult> | null = null;
let lastAttempt = 0;

/**
 * Refresh only if the last attempt is older than the TTL. Called from page loads
 * so the stream stays current without a cron job; de-duped so concurrent viewers
 * trigger at most one fetch, and a broken feed doesn't retry-storm.
 */
export async function refreshUpdatesIfStale(): Promise<void> {
  const ttlMs = UPDATES_TTL_MINUTES * 60_000;
  try {
    if (Date.now() - lastAttempt < ttlMs) return;

    // Cold start: if another instance pulled recently, don't pull again.
    if (lastAttempt === 0) {
      const last = await lastUpdateFetch();
      if (last && Date.now() - last.getTime() < ttlMs) {
        lastAttempt = last.getTime();
        return;
      }
    }

    lastAttempt = Date.now();
    if (!inFlight) {
      inFlight = refreshUpdates().finally(() => {
        inFlight = null;
      });
    }
    await inFlight;
  } catch {
    // never let the updates pipeline break a page render
  }
}
