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
}): number {
  let score = 0;
  if (params.hasCategoryMatch) score += 2;
  if (params.budgetMax && params.lowestPrice !== null) {
    if (params.lowestPrice <= params.budgetMax) score += 2;
    else score -= 1; // over budget — still shown, just ranked lower
  }
  if (params.featured) score += 1;
  score += Math.min(params.offerCount, 3) * 0.25; // more retailers = safer pick
  return score;
}
