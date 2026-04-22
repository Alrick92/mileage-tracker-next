import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";

import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "Settings · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const t = translator(user.locale);

  return (
    <div className="max-w-2xl space-y-6">
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
          <div className="flex items-center justify-between py-2">
            <dt className="text-zinc-500">{t("settings.profile.email")}</dt>
            <dd className="font-mono text-xs text-zinc-900">{user.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
