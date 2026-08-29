import type { STATUSES } from "@/lib/validation";

/** A record after a feed adapter has normalised it, before it hits the DB. */
export interface NormalizedRecord {
  /** Stable id from the source; used for idempotent upserts. */
  externalId: string;
  recordType: "seeking" | "info";
  fullName: string;
  alsoKnownAs?: string;
  ageYears?: number;
  ageIsApprox?: boolean;
  sex?: "female" | "male" | "other" | "unknown";
  nationality?: string;
  homeLocation?: string;
  lastSeenLocation?: string;
  lastSeenAt?: Date;
  description?: string;
  photoUrl?: string;
  status?: (typeof STATUSES)[number];
  authorName?: string;
  /** Source flags this record as an unverified community report. */
  unverified?: boolean;
  notes?: NormalizedNote[];
}

export interface NormalizedNote {
  externalId: string;
  text: string;
  status?: (typeof STATUSES)[number];
  lastKnownLocation?: string;
  authorName?: string;
  createdAt?: Date;
}

export interface IngestResult {
  sourceId: string;
  imported: number;
  updated: number;
  skipped: number;
  /** records that dropped out of the feed and started their grace period */
  reconcileGrace: number;
  /** records missing long enough that they were held for a moderator */
  reconcileHeld: number;
  errors: string[];
}
