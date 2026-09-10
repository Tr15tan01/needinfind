import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/safe-auth";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getSafeSession();
  if (session?.user) redirect("/account");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-5 py-16 text-center">
      <p className="flex items-baseline gap-1">
        <span className="font-display text-lg italic text-ink-900">Need</span>
        <span className="font-display text-lg text-trust-700">InFind</span>
      </p>
      <h1 className="mt-4 font-display text-2xl text-ink-900">Create an account</h1>
      <p className="mt-2 text-sm text-ink-500">
        Free to join — you&apos;ll get more AI messages per month than browsing as a
        guest.
      </p>

      <RegisterForm />

      <p className="mt-5 text-xs text-ink-300">
        Already have an account?{" "}
        <Link href="/login" className="text-trust-700 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
