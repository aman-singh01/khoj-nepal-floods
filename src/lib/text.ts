/**
 * Name normalisation for fuzzy search.
 *
 * Families spell transliterated names many ways ("Shrestha" / "Shreshtha",
 * "Gurung" / "Gurun"). We fold case and Latin diacritics and collapse spacing so
 * the matcher compares like with like. Non-Latin scripts (Devanagari, etc.) are
 * left intact - still searchable - since stripping their combining vowel signs
 * would change the word.
 */
const LATIN_DIACRITICS = /[̀-ͯ]/g;

export function normalizeName(input: string): string {
  return input
    .normalize("NFKD")
    .replace(LATIN_DIACRITICS, "")
    .toLowerCase()
    // drop punctuation but keep letters, digits, and combining marks (e.g.
    // Devanagari vowel signs, which are marks, not letters)
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Collapse and trim arbitrary user text; returns undefined for blank input. */
export function cleanText(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const v = input.replace(/\s+/g, " ").trim();
  return v.length ? v : undefined;
}

/** Multi-line user text: trim, cap blank runs, drop trailing whitespace. */
export function cleanMultiline(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const v = input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return v.length ? v : undefined;
}
