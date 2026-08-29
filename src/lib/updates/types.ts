import type { UpdateTrust } from "@/config/update-feeds";

/** One item after a feed adapter has normalised it, before the DB. */
export interface NormalizedUpdate {
  feed: string;
  source: string;
  trust: UpdateTrust;
  title: string;
  summary?: string;
  url: string;
  publishedAt: Date;
}

export interface RefreshResult {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: string[];
}
