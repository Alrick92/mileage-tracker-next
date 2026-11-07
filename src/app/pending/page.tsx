import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui";
import { logoutAction } from "@/app/actions/auth";

export const metadata = {
  title: "Account pending · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (user?.enabled) redirect("/dashboard");
  return (
    <main className="pt-safe pb-safe flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Account pending approval
          </h1>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900 sm:p-6">
          <p>
            Thanks for registering. An administrator must enable your account
            before you can sign in. Please check back later, or contact your
            administrator to request approval.
          </p>
        </div>
        {user ? (
          <form action={logoutAction} className="mt-6 text-center">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </form>
        ) : (
          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center px-1 font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
