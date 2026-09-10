import { NextResponse } from "next/server";
import { getSafeSession } from "@/lib/safe-auth";
import { getGuestToken } from "@/lib/guest-session";
import { GUEST_COOKIE_NAME } from "@/lib/guest-cookie";
import { handleAssistantMessage } from "@/lib/services/assistant";
import { checkAndConsumeMessage } from "@/lib/services/usage";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let body: { conversationId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const session = await getSafeSession();
  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;

  let guestToken = userId ? null : await getGuestToken();
  let setGuestCookie = false;
  if (!userId && !guestToken) {
    // Safety net for the rare case where this is the very first request of
    // a session and middleware's Set-Cookie hasn't round-tripped through
    // the browser yet — see src/lib/guest-session.ts for the normal path.
    guestToken = crypto.randomUUID();
    setGuestCookie = true;
  }

  // Anti-abuse burst check — independent of and in addition to the monthly
  // cap below (spec §14).
  if (isRateLimited(userId ?? guestToken ?? "anonymous")) {
    return NextResponse.json(
      {
        conversationId: body.conversationId ?? null,
        reply: "You're sending messages a little too fast — please wait a moment and try again.",
        products: [],
        limitReached: false
      },
      { status: 200 }
    );
  }

  // Server-enforced monthly usage cap (spec §13/§14). Checked and consumed
  // BEFORE calling Gemini, so a rejected message never costs anything.
  const usage = await checkAndConsumeMessage({ userId, guestToken });
  if (!usage.allowed) {
    const reply = userId
      ? `You've used all ${usage.limit} AI messages included in your current plan this period. Upgrade for a higher limit.`
      : `You've used your ${usage.limit} free guest messages. Sign in or create a free account for a higher monthly limit.`;

    const response = NextResponse.json({
      conversationId: body.conversationId ?? null,
      reply,
      products: [],
      limitReached: true
    });
    if (setGuestCookie && guestToken) {
      response.cookies.set(GUEST_COOKIE_NAME, guestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365
      });
    }
    return response;
  }

  try {
    const result = await handleAssistantMessage(body.conversationId ?? null, message, {
      userId,
      guestToken
    });

    const response = NextResponse.json({ ...result, limitReached: false });
    if (setGuestCookie && guestToken) {
      response.cookies.set(GUEST_COOKIE_NAME, guestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365
      });
    }
    return response;
  } catch (error) {
    console.error("Assistant message handling failed:", error);
    return NextResponse.json(
      {
        conversationId: body.conversationId ?? null,
        reply:
          "The AI assistant is temporarily unavailable. You can still browse our products and comparisons while we restore the service.",
        products: [],
        limitReached: false
      },
      { status: 200 }
    );
  }
}
