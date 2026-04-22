import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export const metadata = {
  title: "Account pending · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const user = await getCurrentUser();
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-bold text-white">
            MT
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Account pending approval
          </h1>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
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
              className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </form>
        ) : (
          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link
              href="/login"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
