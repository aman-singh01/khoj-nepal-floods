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

/**
 * Remove phone numbers and email addresses from free text before it is stored
 * from an external feed. Khoj keeps contact details private by design; imported
 * descriptions sometimes carry "Contact: 98xxxxxxxx" style strings.
 */
export function scrubContacts(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const out = input
    // "Contact:", "Family contacts:", "Phone -" labels and what follows
    .replace(
      /\b(family\s+)?(contacts?|phone|mobile|tel|whats\s?app|ph)\s*(no\.?|number|numbers)?\s*[:\-–]?\s*(and|,|\+?[()\d])[\d\s()+\-.,/]*/gi,
      "",
    )
    // passport / permit / ID / citizenship / licence numbers (labelled)
    .replace(
      /\b(passport|permit|citizenship|national\s*id|aadha?ar|licen[cs]e|pan)\s*(no\.?|number|#|id)?\s*[:\-–]?\s*[a-z]{0,3}[\d/-]{4,}/gi,
      "",
    )
    // dates of birth
    .replace(
      /\b(d\.?o\.?b\.?|date of birth)\s*[:\-–]?\s*\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}/gi,
      "",
    )
    // bare phone-like runs (7+ digits, optional +, spaces, dashes)
    .replace(/\+?\d[\d\s()\-.]{6,}\d/g, "")
    // emails
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "")
    // tidy up
    .replace(/\b(and|number|numbers)\b\s*(?=[.,;]|$)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .replace(/([.,;])[\s.,;]*\1/g, "$1")
    .replace(/^[\s,;]+|[\s,;]+$/g, "")
    .trim();
  return out.length ? out : undefined;
}
