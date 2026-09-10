import { describe, it, expect } from "vitest";
import { assistantTurnSchema } from "./requirements";

describe("assistantTurnSchema", () => {
  it("accepts a well-formed 'ask' turn", () => {
    const result = assistantTurnSchema.safeParse({
      action: "ask",
      question: "What's your budget?",
      requirements: { categorySlug: "laptops", budgetMax: null, keywords: [], notes: null }
    });
    expect(result.success).toBe(true);
  });

  it("accepts a well-formed 'recommend' turn", () => {
    const result = assistantTurnSchema.safeParse({
      action: "recommend",
      question: null,
      requirements: { categorySlug: "laptops", budgetMax: 1000, keywords: ["programming"], notes: null }
    });
    expect(result.success).toBe(true);
  });

  it("accepts requirements with every field omitted", () => {
    const result = assistantTurnSchema.safeParse({ action: "ask", requirements: {} });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid action value — this is exactly the case where a", () => {
    // misbehaving model response must never be trusted blindly (spec §10/§11).
    const result = assistantTurnSchema.safeParse({
      action: "buy_now_for_them",
      requirements: {}
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative budgetMax", () => {
    const result = assistantTurnSchema.safeParse({
      action: "recommend",
      requirements: { budgetMax: -50 }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a completely missing requirements object", () => {
    const result = assistantTurnSchema.safeParse({ action: "ask" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string keywords", () => {
    const result = assistantTurnSchema.safeParse({
      action: "recommend",
      requirements: { keywords: [123, 456] }
    });
    expect(result.success).toBe(false);
  });
});
