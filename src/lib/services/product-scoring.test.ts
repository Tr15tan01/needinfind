import { describe, it, expect } from "vitest";
import { scoreCandidate } from "./product-scoring";

describe("scoreCandidate", () => {
  it("scores a category match higher than no match, all else equal", () => {
    const withMatch = scoreCandidate({
      hasCategoryMatch: true,
      lowestPrice: null,
      featured: false,
      offerCount: 0
    });
    const withoutMatch = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      featured: false,
      offerCount: 0
    });
    expect(withMatch).toBeGreaterThan(withoutMatch);
  });

  it("rewards being within budget", () => {
    const withinBudget = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: 800,
      budgetMax: 1000,
      featured: false,
      offerCount: 0
    });
    const noBudgetGiven = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: 800,
      featured: false,
      offerCount: 0
    });
    expect(withinBudget).toBeGreaterThan(noBudgetGiven);
  });

  it("penalizes being over budget rather than ignoring price entirely", () => {
    const overBudget = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: 1500,
      budgetMax: 1000,
      featured: false,
      offerCount: 0
    });
    const noPriceData = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      budgetMax: 1000,
      featured: false,
      offerCount: 0
    });
    expect(overBudget).toBeLessThan(noPriceData);
  });

  it("never fully excludes an over-budget product — it's ranked lower, not removed", () => {
    // This is what lets the assistant still show "closest available option"
    // rather than reporting zero results whenever nothing fits the budget.
    const overBudget = scoreCandidate({
      hasCategoryMatch: true,
      lowestPrice: 1500,
      budgetMax: 1000,
      featured: false,
      offerCount: 0
    });
    expect(overBudget).toBeGreaterThan(-Infinity);
  });

  it("gives more retailers a small edge, capped at 3", () => {
    const twoRetailers = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      featured: false,
      offerCount: 2
    });
    const fiveRetailers = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      featured: false,
      offerCount: 5
    });
    const threeRetailers = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      featured: false,
      offerCount: 3
    });
    expect(fiveRetailers).toBe(threeRetailers); // capped, so 5 shouldn't beat 3
    expect(threeRetailers).toBeGreaterThan(twoRetailers);
  });

  it("rewards featured status", () => {
    const featured = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      featured: true,
      offerCount: 0
    });
    const notFeatured = scoreCandidate({
      hasCategoryMatch: false,
      lowestPrice: null,
      featured: false,
      offerCount: 0
    });
    expect(featured).toBeGreaterThan(notFeatured);
  });
});
