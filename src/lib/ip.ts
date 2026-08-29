import { createHash } from "node:crypto";
import { IP_HASH_SALT } from "./env";

/**
 * We never store raw IP addresses. A salted hash is enough to rate-limit and to
 * cluster abuse from one source, without holding personal data on people who are
 * already in a crisis.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256")
    .update(`${IP_HASH_SALT}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/** Best-effort client IP from a Next.js request's headers. */
export function clientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip");
}
