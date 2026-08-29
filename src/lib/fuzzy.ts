/**
 * Name matching that runs in the application, not the database.
 *
 * We deliberately do NOT depend on the Postgres `pg_trgm` extension: it isn't
 * available on every host (or in the embedded PGlite used for dev/tests). Instead
 * the query pulls a generous candidate set with plain `ILIKE`, and we rank here.
 * A production deployment on a big dataset can add a `pg_trgm` GIN index purely
 * as an optimisation - the ranking logic stays the same.
 */

function trigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

/** Sørensen–Dice coefficient over trigram sets. 0..1 */
export function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let inter = 0;
  for (const g of ta) if (tb.has(g)) inter++;
  return (2 * inter) / (ta.size + tb.size);
}

export function tokenize(s: string): string[] {
  return s.split(/\s+/).filter((t) => t.length >= 2);
}

/**
 * Score how well a normalised query matches a normalised candidate name.
 * Combines whole-string trigram similarity with token containment so that
 * "arati shresta" still ranks "aarati shrestha" highly.
 */
export function scoreName(queryNorm: string, candidateNorm: string): number {
  if (!queryNorm) return 0;
  const dice = trigramSimilarity(queryNorm, candidateNorm);

  if (candidateNorm.includes(queryNorm)) return Math.max(dice, 0.95);

  const qTokens = tokenize(queryNorm);
  if (qTokens.length === 0) return dice;

  let contained = 0;
  let perTokenSim = 0;
  const cTokens = tokenize(candidateNorm);
  for (const qt of qTokens) {
    if (candidateNorm.includes(qt)) {
      contained++;
      perTokenSim += 1;
      continue;
    }
    let best = 0;
    for (const ct of cTokens) best = Math.max(best, trigramSimilarity(qt, ct));
    perTokenSim += best;
  }
  const tokenScore = perTokenSim / qTokens.length;
  const containBonus = contained / qTokens.length;

  return Math.min(1, Math.max(dice, 0.55 * tokenScore + 0.4 * containBonus));
}

export const MATCH_THRESHOLD = 0.3;
