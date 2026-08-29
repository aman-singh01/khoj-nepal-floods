import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { MODERATION_TOKEN } from "./env";

export const MOD_COOKIE = "khoj_mod";

export function tokenValid(candidate: string | undefined | null): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(MODERATION_TOKEN);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True when the current request carries a valid moderator cookie. */
export async function isModerator(): Promise<boolean> {
  const jar = await cookies();
  return tokenValid(jar.get(MOD_COOKIE)?.value);
}
