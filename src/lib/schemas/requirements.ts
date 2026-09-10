import { z } from "zod";

/**
 * Every Gemini call in the assistant flow is asked to return exactly this
 * shape. Parsing through `.safeParse` (never `as`-casting the raw JSON) is
 * the spec §10/§11 requirement in code: "The backend should validate
 * AI-generated structured data before using it. Never trust raw AI output
 * blindly."
 */
export const assistantTurnSchema = z.object({
  // "ask": needs more info before it can search. "recommend": ready to
  // search the catalog with the requirements gathered so far.
  action: z.enum(["ask", "recommend"]),
  // Required when action is "ask" — the next clarifying question to show.
  question: z.string().nullable().optional(),
  // Structured requirements extracted so far. Every field optional since
  // early turns may only have one or two filled in — this is *merged* into
  // the conversation's stored requirements turn over turn, not replaced.
  requirements: z.object({
    categorySlug: z.string().nullable().optional(),
    budgetMax: z.number().positive().nullable().optional(),
    keywords: z.array(z.string()).optional(),
    notes: z.string().nullable().optional()
  })
});

export type AssistantTurn = z.infer<typeof assistantTurnSchema>;

// Safe fallback used whenever Gemini's output fails validation or the call
// fails outright — always "ask" with a generic, honest question rather than
// guessing at what the user wants.
export const fallbackAskTurn: AssistantTurn = {
  action: "ask",
  question:
    "Could you tell me a bit more about what you're trying to do? For example, what it's for and roughly what budget you have in mind.",
  requirements: {}
};
