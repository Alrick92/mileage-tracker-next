import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { translator } from "@/lib/i18n";

import { EnabledToggleForm, RoleToggleForm } from "./UserRowForms";

export const metadata = {
  title: "User administration · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const t = translator(admin.locale);

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      enabled: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("admin.subtitle")}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("admin.col.user")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.col.role")}</th>
              <th className="px-4 py-3 font-medium">
                {t("admin.col.enabled")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("admin.col.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => {
              const isSelf = u.id === admin.id;
              return (
                <tr key={u.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {u.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          {t("admin.youLabel")}
                        </span>
                      ) : null}
                    </div>
                    <div className="font-mono text-xs text-zinc-500">
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.role === "ADMIN"
                          ? "inline-flex items-center rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white"
                          : "inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-700"
                      }
                    >
                      {u.role === "ADMIN"
                        ? t("admin.role.admin")
                        : t("admin.role.user")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.enabled
                          ? "inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-800"
                          : "inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-800"
                      }
                    >
                      {u.enabled ? t("common.yes") : t("common.no")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <EnabledToggleForm
                        userId={u.id}
                        enabled={u.enabled}
                        isSelf={isSelf}
                        labels={{
                          enable: t("admin.action.enable"),
                          disable: t("admin.action.disable"),
                        }}
                      />
                      <RoleToggleForm
                        userId={u.id}
                        role={u.role}
                        isSelf={isSelf}
                        labels={{
                          promote: t("admin.action.promote"),
                          demote: t("admin.action.demote"),
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
