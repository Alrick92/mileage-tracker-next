import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { Toast } from "@/app/(app)/_components/Toast";

import {
  AdminEmailForm,
  AdminPasswordForm,
} from "./AdminUserEditForms";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  emailUpdated?: string;
  passwordUpdated?: string;
}>;

export default async function AdminEditUserPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const admin = await requireAdmin();
  const t = translator(admin.locale);
  const { id } = await params;
  const { emailUpdated, passwordUpdated } = await searchParams;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!target) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/users"
        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← {t("admin.reset.back")}
      </Link>

      {emailUpdated ? (
        <Toast variant="success" message={t("toast.emailUpdated")} />
      ) : null}
      {passwordUpdated ? (
        <Toast variant="success" message={t("toast.passwordUpdated")} />
      ) : null}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin.edit.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("admin.edit.subtitle")}</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <dl className="mb-4 space-y-1 rounded-lg bg-zinc-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">{t("settings.profile.name")}</dt>
            <dd className="font-medium text-zinc-900">{target.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">{t("settings.email.current")}</dt>
            <dd className="font-mono text-xs text-zinc-900">{target.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.edit.emailHeading")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("admin.edit.emailSubtitle")}
        </p>
        <div className="mt-4">
          <AdminEmailForm
            userId={target.id}
            defaultEmail={target.email}
            labels={{
              newLabel: t("settings.email.new"),
              save: t("admin.edit.saveEmail"),
              saving: t("common.saving"),
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.edit.passwordHeading")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("admin.edit.passwordSubtitle")}
        </p>
        <div className="mt-4">
          <AdminPasswordForm
            userId={target.id}
            labels={{
              newLabel: t("password.new"),
              confirmLabel: t("password.confirm"),
              save: t("admin.edit.savePassword"),
              saving: t("common.saving"),
            }}
          />
        </div>
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-500">
            {t("admin.edit.resetAlternative")}
          </p>
          <Link
            href={`/admin/users/${target.id}/reset-password`}
            className="mt-2 inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {t("admin.action.resetPassword")}
          </Link>
        </div>
      </section>
    </div>
  );
}
