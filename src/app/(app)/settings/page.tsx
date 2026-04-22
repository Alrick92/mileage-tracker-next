import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { Toast } from "@/app/(app)/_components/Toast";

import { EmailForm } from "./EmailForm";
import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "Settings · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  passwordUpdated?: string;
  emailUpdated?: string;
}>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { passwordUpdated, emailUpdated } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      {passwordUpdated ? (
        <Toast variant="success" message={t("toast.passwordUpdated")} />
      ) : null}
      {emailUpdated ? (
        <Toast variant="success" message={t("toast.emailUpdated")} />
      ) : null}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("settings.subtitle")}</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <SettingsForm
          defaultUnit={user.unit}
          defaultLocale={user.locale}
          labels={{
            unitLabel: t("settings.unit.label"),
            unitHelp: t("settings.unit.help"),
            km: t("common.kilometers"),
            mi: t("common.miles"),
            localeLabel: t("settings.locale.label"),
            localeHelp: t("settings.locale.help"),
            english: t("common.english"),
            french: t("common.french"),
            save: t("settings.save"),
            saving: t("common.saving"),
            saved: t("settings.saved"),
          }}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("settings.profile.heading")}
        </h2>
        <dl className="mt-3 divide-y divide-zinc-100 text-sm">
          <div className="flex items-center justify-between py-2">
            <dt className="text-zinc-500">{t("settings.profile.name")}</dt>
            <dd className="font-medium text-zinc-900">{user.name}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Link
            href="/settings/password"
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {t("settings.password.link")}
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <EmailForm
          defaultEmail={user.email}
          labels={{
            heading: t("settings.email.heading"),
            subtitle: t("settings.email.subtitle"),
            currentLabel: t("settings.email.current"),
            newLabel: t("settings.email.new"),
            currentPasswordLabel: t("password.current"),
            save: t("settings.email.save"),
            saving: t("common.saving"),
          }}
        />
      </section>
    </div>
  );
}
