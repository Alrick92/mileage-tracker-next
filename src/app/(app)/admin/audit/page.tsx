import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { localeTag, translator, type Locale } from "@/lib/i18n";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { Pagination } from "@/app/(app)/_components/Pagination";
import { formatOdometer, type Unit } from "@/lib/units";

export const metadata = {
  title: "Audit log · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string }>;

type AuditDetails = {
  vehicleId?: string;
  previousVehicleId?: string;
  startOdometerKm?: number;
  endOdometerKm?: number;
  prevStartOdometerKm?: number;
  prevEndOdometerKm?: number;
  initialOdometerKm?: number;
  changed?: string[];
  change?: string;
  source?: string;
};

/**
 * Pick the display label for an audit row. For trip updates, the label is
 * specialized based on what the user actually changed so that notes-only
 * edits are not shown as "mileage modified".
 */
function actionLabel(
  action: string,
  details: AuditDetails,
  t: (key: string) => string,
): string {
  if (action === "TRIP_UPDATED") {
    const changed = new Set(details.changed ?? []);
    const hasOdometer =
      changed.has("startOdometer") || changed.has("endOdometer");
    const hasNotes = changed.has("notes");
    if (hasOdometer) return t("audit.action.TRIP_UPDATED.odometer");
    if (hasNotes && changed.size === 1)
      return t("audit.action.TRIP_UPDATED.notes");
    return t("audit.action.TRIP_UPDATED.other");
  }
  return t(`audit.action.${action}`);
}

/**
 * Render the distance details line for a log row, converting the stored km
 * values into the viewer's preferred unit + locale.
 */
function detailsLine(
  action: string,
  details: AuditDetails,
  unit: Unit,
  locale: Locale,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  if (action === "TRIP_CREATED") {
    if (
      typeof details.startOdometerKm === "number" &&
      typeof details.endOdometerKm === "number"
    ) {
      return t("audit.detail.odometer", {
        start: formatOdometer(details.startOdometerKm, unit, locale),
        end: formatOdometer(details.endOdometerKm, unit, locale),
      });
    }
    return null;
  }
  if (action === "TRIP_UPDATED") {
    const changed = new Set(details.changed ?? []);
    const odometerChanged =
      changed.has("startOdometer") || changed.has("endOdometer");
    if (
      odometerChanged &&
      typeof details.prevStartOdometerKm === "number" &&
      typeof details.prevEndOdometerKm === "number" &&
      typeof details.startOdometerKm === "number" &&
      typeof details.endOdometerKm === "number"
    ) {
      return t("audit.detail.odometerChanged", {
        prevStart: formatOdometer(details.prevStartOdometerKm, unit, locale),
        prevEnd: formatOdometer(details.prevEndOdometerKm, unit, locale),
        start: formatOdometer(details.startOdometerKm, unit, locale),
        end: formatOdometer(details.endOdometerKm, unit, locale),
      });
    }
    // The action label already conveys a notes-only edit; only render a
    // "Updated: …" line when non-odometer, non-notes fields changed so the
    // detail column adds information instead of repeating the label.
    const otherChanges = [...changed].filter(
      (f) => f !== "notes" && f !== "startOdometer" && f !== "endOdometer",
    );
    if (otherChanges.length > 0) {
      const names = otherChanges
        .map((f) => t(`audit.field.${f}`))
        .filter((s) => !s.startsWith("audit.field."));
      if (names.length > 0) {
        return t("audit.detail.changedFields", { fields: names.join(", ") });
      }
    }
    return null;
  }
  if (
    action === "VEHICLE_CREATED" &&
    typeof details.initialOdometerKm === "number" &&
    details.initialOdometerKm > 0
  ) {
    return t("audit.detail.initialOdometer", {
      value: formatOdometer(details.initialOdometerKm, unit, locale),
    });
  }
  return null;
}

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
      details: true,
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
  const unit = admin.unit as Unit;

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
                    const details =
                      (log.details as AuditDetails | null) ?? {};
                    const label = actionLabel(log.action, details, t);
                    const extra = detailsLine(
                      log.action,
                      details,
                      unit,
                      admin.locale,
                      t,
                    );
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
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          <div>{log.summary}</div>
                          {extra ? (
                            <div className="mt-0.5 text-xs text-zinc-500">
                              {extra}
                            </div>
                          ) : null}
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
