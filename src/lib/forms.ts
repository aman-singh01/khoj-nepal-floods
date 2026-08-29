import { headers } from "next/headers";
import { clientIpFromHeaders, hashIp } from "./ip";

/** FormData -> plain object of string fields (files and blanks-as-absent skipped). */
export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of fd.entries()) {
    if (typeof value !== "string") continue;
    out[key] = value;
  }
  return out;
}

export async function requestIpHash(): Promise<string | null> {
  const h = await headers();
  return hashIp(clientIpFromHeaders(h));
}

/** Shape returned by every form server action, consumed by useActionState. */
export interface ActionState {
  ok: boolean;
  message?: string;
  /** field name -> first error */
  errors?: Record<string, string>;
  /** set on success when we want the client to navigate */
  redirectTo?: string;
}

export function fieldErrors(
  zodError: { issues: { path: (string | number)[]; message: string }[] },
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
