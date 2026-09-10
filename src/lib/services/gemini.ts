import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Thin wrapper around the Gemini SDK. Everything that talks to the model
 * goes through here, for two reasons: (1) the API key never has to be
 * imported anywhere else, and (2) spec §40's "AI failure behavior" — every
 * call is expected to be wrapped in try/catch by its caller, so a Gemini
 * outage degrades to a fallback message instead of a crash.
 */

// "gemini-1.5-flash" (the original default here) is end-of-life as of
// 2026 — Google has been rotating specific dated model names on a
// regular cadence. Using the "latest" alias instead of a pinned version
// means this stays working without needing a code change every time a
// specific model is deprecated; set GEMINI_MODEL explicitly if you want
// to pin to a specific version instead.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-latest";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Asks Gemini for a single JSON object matching the shape described in the
// prompt. Returns the raw parsed value — the caller is responsible for
// validating it (spec §10: "Never trust raw AI output blindly").
export async function generateJson(prompt: string): Promise<unknown> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" }
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

// Asks Gemini for plain text — used only for the final, grounded
// explanation of already-selected candidate products (never for deciding
// which products exist).
export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
