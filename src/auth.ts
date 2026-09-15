import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/services/analytics";

/**
 * Three auth flows share this one NextAuth config:
 *
 * 1. Admin (Phase 2) — provider id "admin-credentials". Email + password
 *    checked against `User.passwordHash`, and `authorize` refuses anyone
 *    whose role isn't ADMIN. Explicit id so it can never be confused with
 *    customer credentials below — the admin login page calls
 *    signIn("admin-credentials", ...) specifically.
 * 2. Customer via Google (Phase 4) — per spec §15's "Support Google login
 *    if practical." Google sign-ins always get the schema's default role
 *    (USER) from the Prisma adapter, so this can never grant admin access.
 * 3. Customer via email/password (Phase 4) — provider id
 *    "customer-credentials". Same `passwordHash` field as admin, but
 *    `authorize` doesn't check role — any account with a password can use
 *    it. That's fine: role is what gates /admin (middleware.ts), not which
 *    login form was used, so an admin account can still sign in here and
 *    simply won't gain anything extra from doing so.
 *
 * Session strategy is JWT app-wide (Credentials providers require it —
 * Auth.js can't use database sessions with them), which is why the
 * adapter is used for account/user persistence but not for sessions.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel (and any host behind a proxy) needs this — otherwise Auth.js
  // rejects incoming requests with "UntrustedHost" because it can't
  // verify the Host header matches AUTH_URL/NEXTAUTH_URL on its own.
  // Safe here because Vercel's edge network sets Host from the actual
  // request, not from arbitrary client input.
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Auth.js only supports one global sign-in page. This points at the admin
  // login since that's where an automatic redirect would matter most (a
  // stray unauthenticated hit on a NextAuth internal route); customer flows
  // never rely on this because /login and /account redirect explicitly
  // themselves rather than depending on Auth.js's built-in redirect.
  pages: {
    signIn: "/admin/login"
  },
  // Fires only when the Prisma adapter creates a brand-new user — i.e. a
  // first-time Google sign-in. Email/password registration creates its own
  // User row directly (src/app/register/actions.ts), so it records this
  // event itself instead; this covers the OAuth path that doesn't go
  // through that action.
  events: {
    async createUser({ user }) {
      if (user.id) recordEvent("REGISTRATION", { userId: user.id });
    }
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    Credentials({
      id: "admin-credentials",
      name: "Admin login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || user.role !== "ADMIN") {
          // Same failure path whether the user doesn't exist, has no
          // password set, or isn't an admin — avoids leaking which case it is.
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    }),
    Credentials({
      id: "customer-credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        // NextAuth sets `sub` to the user id internally, but pin it
        // explicitly here too — this is the id every downstream usage/
        // conversation-ownership check relies on.
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & { role?: string; id?: string };
        user.role = token.role as string | undefined;
        if (token.sub) user.id = token.sub;
      }
      return session;
    }
  }
});
