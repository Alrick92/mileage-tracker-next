import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui";

import { RegisterForm } from "./RegisterForm";

export const metadata = {
  title: "Create account · Mileage Tracker",
};

export default async function RegisterPage() {
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Start tracking your fleet in seconds.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs sm:p-6">
          <RegisterForm />
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center px-1 font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
