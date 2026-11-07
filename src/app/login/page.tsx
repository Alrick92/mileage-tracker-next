import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui";

import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in · Mileage Tracker",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.enabled) redirect("/dashboard");
  if (user) redirect("/pending");

  return (
    <main className="pt-safe pb-safe flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mileage Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to your fleet account.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs sm:p-6">
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">
          No account yet?{" "}
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center px-1 font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
