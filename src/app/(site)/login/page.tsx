import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getSafeSession } from "@/lib/safe-auth";
import { CredentialsLoginForm } from "./credentials-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSafeSession();
  if (session?.user) redirect("/account");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-5 py-16 text-center">
      <p className="flex items-baseline gap-1">
        <span className="font-display text-lg italic text-ink-900">Need</span>
        <span className="font-display text-lg text-trust-700">InFind</span>
      </p>
      <h1 className="mt-4 font-display text-2xl text-ink-900">Sign in</h1>
      <p className="mt-2 text-sm text-ink-500">
        Save your conversations and get a higher free AI message allowance than
        browsing as a guest.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
        className="mt-7 w-full"
      >
        <button
          type="submit"
          className="w-full rounded-full border border-ink-100 bg-surface px-4 py-2.5 text-sm font-medium text-ink-900 shadow-soft transition hover:shadow-lifted"
        >
          Continue with Google
        </button>
      </form>

      <div className="my-6 flex w-full items-center gap-3 text-xs text-ink-300">
        <span className="h-px flex-1 bg-ink-100" />
        or
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <CredentialsLoginForm />

      <p className="mt-5 text-xs text-ink-300">
        No account?{" "}
        <Link href="/register" className="text-trust-700 underline">
          Create one
        </Link>
        , or keep browsing and asking the assistant as a guest.
      </p>
    </div>
  );
}
