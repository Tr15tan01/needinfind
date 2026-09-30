/**
 * Deterministic product-matching score (per spec §11: category/budget/
 * feature match — nothing model-generated). Deliberately has zero
 * imports, including no Prisma — that's what makes it possible to unit
 * test in complete isolation (product-scoring.test.ts) without a database
 * or a generated Prisma Client at all.
 */
export function scoreCandidate(params: {
  hasCategoryMatch: boolean;
  lowestPrice: number | null;
  budgetMax?: number | null;
  featured: boolean;
  offerCount: number;
  // How strongly the product's text matches the search words (see
  // countKeywordHits). Optional so older callers/tests keep working.
  keywordHits?: number;
}): number {
  let score = 0;
  if (params.hasCategoryMatch) score += 2;
  if (params.budgetMax && params.lowestPrice !== null) {
    if (params.lowestPrice <= params.budgetMax) score += 2;
    else score -= 1; // over budget — still shown, just ranked lower
  }
  if (params.featured) score += 1;
  score += Math.min(params.offerCount, 3) * 0.25; // more retailers = safer pick
  score += Math.min(params.keywordHits ?? 0, 8) * 0.75;
  return score;
}

// Words that carry no product meaning — searching for them only makes
// matching stricter (or noisier) without helping.
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "with", "without", "to", "of", "in", "on", "at", "by",
  "my", "me", "i", "im", "need", "want", "looking", "some", "something", "good", "best", "new",
  "buy", "get", "under", "over", "around", "about", "budget", "cheap", "price", "usd", "dollar",
  "dollars", "that", "this", "is", "it", "be", "can", "will", "going", "use", "using", "used"
]);

// Very light singularization so "laptops" matches "laptop", "hooks" → "hook".
function singular(word: string) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/**
 * Turns the model's keyword phrases ("business laptop", "picture hanging
 * kit") into individual search words: lower-cased, stopwords removed,
 * singularized, de-duplicated. Matching on single words with OR (rather
 * than requiring every phrase) is what stops searches coming back empty.
 */
export function normalizeKeywords(keywords: string[] | undefined, limit = 10): string[] {
  const out: string[] = [];
  for (const phrase of keywords ?? []) {
    for (const raw of phrase.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 3 || STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
      const word = singular(raw);
      if (!out.includes(word)) out.push(word);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Name matches count double; brand/description/category matches count once. */
export function countKeywordHits(
  tokens: string[],
  text: { name: string; other: string }
): number {
  const name = text.name.toLowerCase();
  const other = text.other.toLowerCase();
  let hits = 0;
  for (const t of tokens) {
    if (name.includes(t)) hits += 2;
    else if (other.includes(t)) hits += 1;
  }
  return hits;
}
