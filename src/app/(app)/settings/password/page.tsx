import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";

import { PasswordForm } from "./PasswordForm";

export const metadata = {
  title: "Change password · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.enabled) redirect("/pending");

  const t = translator(user.locale);
  const forced = user.mustChangePassword;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {forced ? t("password.forced.title") : t("password.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {forced ? t("password.forced.subtitle") : t("password.subtitle")}
        </p>
      </header>

      {forced ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("password.forced.subtitle")}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <PasswordForm
          labels={{
            current: t("password.current"),
            new: t("password.new"),
            confirm: t("password.confirm"),
            save: t("password.save"),
            saving: t("common.saving"),
          }}
        />
      </section>
    </div>
  );
}
