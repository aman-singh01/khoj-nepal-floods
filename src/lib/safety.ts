/**
 * Lightweight content screening.
 *
 * Disaster missing-person boards attract fraud ("I have your relative, wire a
 * release fee"), so we auto-route anything that smells like a payment demand to
 * the moderation queue instead of publishing it immediately. This is a coarse
 * first filter, not a judgement - a moderator makes the call.
 */

const MONEY_PATTERNS: RegExp[] = [
  /\b(western union|moneygram|money gram)\b/i,
  /\b(bitcoin|btc|usdt|crypto|ethereum|eth wallet)\b/i,
  /\b(gift ?card|itunes card|google play card|steam card)\b/i,
  /\b(wire|transfer|deposit|pay|send)\s+(me\s+)?(\$|usd|npr|rs\.?|money|funds|\d)/i,
  /\b(release fee|processing fee|admin fee|clearance fee|ransom)\b/i,
  /\b(bank account|account number|routing number|iban|swift code)\b/i,
];

const CONTACT_IN_BODY = /\b(\+?\d[\d\s().-]{7,}\d|[\w.+-]+@[\w-]+\.[\w.-]+)\b/;

export interface ScreenResult {
  /** true when the text should be held for moderation rather than published. */
  hold: boolean;
  reasons: string[];
}

export function screenText(...parts: (string | null | undefined)[]): ScreenResult {
  const text = parts.filter(Boolean).join("\n");
  const reasons: string[] = [];

  if (MONEY_PATTERNS.some((re) => re.test(text))) {
    reasons.push("mentions payment / money transfer");
  }
  if (CONTACT_IN_BODY.test(text)) {
    reasons.push("contains a phone number or email in free text");
  }

  return { hold: reasons.length > 0, reasons };
}

/** Honeypot: real users never fill a hidden field. */
export function isBotSubmission(form: {
  get(name: string): unknown;
}): boolean {
  const trap = form.get("company_website");
  return typeof trap === "string" && trap.trim().length > 0;
}
