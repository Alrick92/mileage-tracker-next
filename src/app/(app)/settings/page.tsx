import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { KeyIcon } from "@/components/icons";
import {
  PageHeader,
  SectionHeading,
  buttonStyles,
  cardStyles,
} from "@/components/ui";
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
    <div className="space-y-6">
      {passwordUpdated ? (
        <Toast variant="success" message={t("toast.passwordUpdated")} />
      ) : null}
      {emailUpdated ? (
        <Toast variant="success" message={t("toast.emailUpdated")} />
      ) : null}
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="grid grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-2">
        <section className={`${cardStyles} p-5 sm:p-6 lg:col-span-2`}>
          <SectionHeading>{t("settings.preferences.heading")}</SectionHeading>
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

        <section className={`${cardStyles} p-5 sm:p-6`}>
          <SectionHeading>{t("settings.profile.heading")}</SectionHeading>
          <dl className="divide-y divide-zinc-100 text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-zinc-500">{t("settings.profile.name")}</dt>
              <dd className="truncate font-medium text-zinc-900">{user.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-zinc-500">{t("settings.profile.email")}</dt>
              <dd className="min-w-0 truncate font-mono text-xs text-zinc-900">
                {user.email}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <Link
              href="/settings/password"
              className={`${buttonStyles.secondary} w-full sm:w-auto`}
            >
              <KeyIcon width={16} height={16} />
              {t("settings.password.link")}
            </Link>
          </div>
        </section>

        <section className={`${cardStyles} p-5 sm:p-6`}>
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
    </div>
  );
}
