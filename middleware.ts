import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GUEST_COOKIE_NAME } from "@/lib/guest-cookie";

// Two jobs in one middleware, both server-side (spec §14/§28: never rely on
// the client for permissions or usage tracking):
//
// 1. Gate the whole /admin tree to role: ADMIN.
// 2. Assign an anonymous guest id to unauthenticated visitors anywhere else
//    on the site, so Phase 5/6 can track conversations/usage per guest
//    without forcing registration.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !isAdminLoginPage) {
    const role = (req.auth?.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", req.nextUrl.origin);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  const isSignedIn = Boolean(req.auth?.user);
  if (!isSignedIn && !req.cookies.get(GUEST_COOKIE_NAME)) {
    response.cookies.set(GUEST_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
  }

  return response;
});

export const config = {
  // Runs on everything except static assets, image optimization, the
  // NextAuth/Stripe webhook API routes (neither needs a guest cookie, and
  // Stripe's request has no cookies to begin with), and the health check
  // (polled frequently by uptime monitors — no auth/cookie logic needed).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|api/health).*)"]
};
