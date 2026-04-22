import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { translator } from "@/lib/i18n";

import { resetPasswordAction } from "../../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ResetPasswordPage({
  params,
}: {
  params: Params;
}) {
  const admin = await requireAdmin();
  const t = translator(admin.locale);
  const { id } = await params;

  if (id === admin.id) notFound();

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!target) notFound();

  // Read the short-lived cookie set by resetPasswordAction. The cookie has
  // a 60s TTL, httpOnly, sameSite=lax, and is path-scoped to this page; the
  // plaintext never appears in the URL, browser history, referer header, or
  // server logs. Next.js does not allow `cookies().set()` in a Server
  // Component, so expiry is left to the TTL rather than being cleared on
  // first read.
  const cookieStore = await cookies();
  const cookieName = `mt_temp_pw_${id}`;
  const temp = cookieStore.get(cookieName)?.value;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/admin/users"
        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← {t("admin.reset.back")}
      </Link>

      {temp ? (
        <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">
            {t("admin.reset.generated.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("admin.reset.generated.body")}
          </p>
          <dl className="mt-4 space-y-2 rounded-lg bg-zinc-50 p-4 text-sm">
            <Row label={t("admin.reset.user")} value={`${target.name} (${target.email})`} />
          </dl>
          <div className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              {t("password.new")}
            </p>
            <p className="mt-1 select-all break-all font-mono text-lg text-emerald-900">
              {temp}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/admin/users"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {t("admin.reset.back")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">
            {t("admin.reset.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("admin.reset.subtitle")}
          </p>
          <dl className="mt-4 space-y-2 rounded-lg bg-zinc-50 p-4 text-sm">
            <Row label={t("admin.reset.user")} value={`${target.name} (${target.email})`} />
          </dl>
          <form
            action={resetPasswordAction}
            className="mt-6 flex items-center gap-3"
          >
            <input type="hidden" name="userId" value={target.id} />
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              {t("admin.reset.confirm")}
            </button>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              {t("common.cancel")}
            </Link>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-900">{value}</dd>
    </div>
  );
}
