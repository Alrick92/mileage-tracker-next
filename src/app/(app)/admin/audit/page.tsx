import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { Pagination } from "@/app/(app)/_components/Pagination";

export const metadata = {
  title: "Audit log · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string }>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = await requireAdmin();
  const t = translator(admin.locale);
  const { page: pageRaw } = await searchParams;

  const total = await prisma.auditLog.count();
  const totalPages = computeTotalPages(total);
  const page = parsePage(pageRaw, totalPages);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      actorId: true,
      actorEmail: true,
      actorName: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      actor: { select: { email: true, name: true } },
    },
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  const tag = localeTag(admin.locale);
  const dtf = new Intl.DateTimeFormat(tag, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("audit.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("audit.subtitle")}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">
            {t("audit.empty")}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("audit.col.time")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("audit.col.actor")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("audit.col.event")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("audit.col.entity")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {logs.map((log) => {
                    // Prefer the live actor record (in case the user was
                    // renamed), otherwise fall back to the snapshot captured
                    // at write time (in case the user was later deleted).
                    const actorName =
                      log.actor?.name ??
                      log.actorName ??
                      (log.actorId ? t("audit.actor.deleted") : t("audit.actor.system"));
                    const actorEmail = log.actor?.email ?? log.actorEmail;
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                          {dtf.format(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">
                            {actorName}
                          </div>
                          {actorEmail ? (
                            <div className="font-mono text-xs text-zinc-500">
                              {actorEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-700">
                            {t(`audit.action.${log.action}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {log.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              basePath="/admin/audit"
              labels={{
                previous: t("pagination.previous"),
                next: t("pagination.next"),
                pageOfTotal: t("pagination.pageOfTotal", {
                  page: page.toLocaleString(tag),
                  total: totalPages.toLocaleString(tag),
                }),
                totalItems: t("pagination.totalItems", {
                  count: total.toLocaleString(tag),
                }),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
