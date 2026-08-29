import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { persons, notes, abuseReports, contactMessages } from "@/db/schema";

/**
 * Rate limiting without extra infrastructure: count how many rows this IP hash
 * has created in a recent window. Good enough to blunt scripted spam; a real
 * deployment behind heavy load should move this to Redis / Upstash.
 */

type Action = "person" | "note" | "report" | "message";

const LIMITS: Record<Action, { max: number; windowMinutes: number }> = {
  person: { max: 6, windowMinutes: 10 },
  note: { max: 20, windowMinutes: 10 },
  report: { max: 15, windowMinutes: 10 },
  message: { max: 10, windowMinutes: 10 },
};

const TABLES = {
  person: persons,
  note: notes,
  report: abuseReports,
  message: contactMessages,
} as const;

const IP_COLUMN = {
  person: persons.submitterIpHash,
  note: notes.submitterIpHash,
  report: abuseReports.reporterIpHash,
  message: contactMessages.senderIpHash,
} as const;

export interface RateResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  action: Action,
  ipHash: string | null,
): Promise<RateResult> {
  if (!ipHash) return { ok: true, retryAfterSeconds: 0 };

  const db = await getDb();
  const { max, windowMinutes } = LIMITS[action];
  const since = new Date(Date.now() - windowMinutes * 60_000);
  const table = TABLES[action];
  const ipCol = IP_COLUMN[action];

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(and(eq(ipCol, ipHash), gte(table.createdAt, since)));

  const count = row?.count ?? 0;
  if (count < max) return { ok: true, retryAfterSeconds: 0 };
  return { ok: false, retryAfterSeconds: windowMinutes * 60 };
}
