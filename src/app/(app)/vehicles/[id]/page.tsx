import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import {
  formatDistance,
  formatOdometer,
  formatOdometerNumber,
  unitShort,
} from "@/lib/units";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { Pagination } from "@/app/(app)/_components/Pagination";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;

function formatDate(d: Date, localeStr: string): string {
  void localeStr;
  return d.toISOString().slice(0, 10);
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { id } = await params;
  const { page: pageRaw } = await searchParams;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: user.id },
  });
  if (!vehicle) notFound();

  const [tripCount, distanceAgg] = await Promise.all([
    prisma.trip.count({ where: { vehicleId: vehicle.id } }),
    prisma.$queryRaw<{ sum: bigint | null }[]>`
      SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
      FROM "Trip"
      WHERE "vehicleId" = ${vehicle.id}
    `,
  ]);
  const totalPages = computeTotalPages(tripCount);
  const page = parsePage(pageRaw, totalPages);

  const trips = await prisma.trip.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  const totalDistanceKm = Number(distanceAgg[0]?.sum ?? 0);
  const unit = user.unit;
  const locale = user.locale;
  const tag = localeTag(locale);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/vehicles"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← {t("vehicles.title")}
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {vehicle.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {[vehicle.year, vehicle.make, vehicle.model]
                .filter(Boolean)
                .join(" ") || "—"}
              {vehicle.licensePlate ? (
                <span className="ml-2 font-mono text-xs">
                  {vehicle.licensePlate}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/vehicles/${vehicle.id}/delete`}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              {t("common.delete")}
            </Link>
            <a
              href={`/api/trips/export?vehicleId=${vehicle.id}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {t("trips.exportCsv")}
            </a>
            <Link
              href={`/trips/new?vehicleId=${vehicle.id}`}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {t("trips.logTrip")}
            </Link>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label={t("dashboard.col.currentOdometer")}
          value={formatOdometer(vehicle.currentOdometer, unit, locale)}
        />
        <SummaryCard
          label={t("dashboard.col.trips")}
          value={tripCount.toLocaleString(tag)}
        />
        <SummaryCard
          label={t("dashboard.stat.distance")}
          value={formatDistance(totalDistanceKm, unit, locale)}
        />
      </section>

      {tripCount === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">
            {t("trips.empty.title")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t("trips.empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {t("trips.col.date")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("trips.col.driver")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("trips.col.start")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("trips.col.end")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("trips.col.distance")} ({unitShort(unit, locale)})
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("trips.col.notes")}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      {formatDate(trip.date, locale)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {trip.driverName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-700">
                      {formatOdometerNumber(trip.startOdometer, unit, locale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-700">
                      {formatOdometerNumber(trip.endOdometer, unit, locale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                      {formatDistance(
                        trip.endOdometer - trip.startOdometer,
                        unit,
                        locale,
                      )}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-zinc-600">
                      {trip.notes ? (
                        <span
                          className="block truncate"
                          title={trip.notes}
                        >
                          {trip.notes}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
                        >
                          {t("common.view")}
                        </Link>
                        <Link
                          href={`/trips/${trip.id}/edit`}
                          className="text-xs font-medium text-zinc-900 underline-offset-4 hover:underline"
                        >
                          {t("common.edit")}
                        </Link>
                        <Link
                          href={`/trips/${trip.id}/delete`}
                          className="text-xs font-medium text-red-600 underline-offset-4 hover:underline"
                        >
                          {t("common.delete")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={tripCount}
            basePath={`/vehicles/${vehicle.id}`}
            labels={{
              previous: t("pagination.previous"),
              next: t("pagination.next"),
              pageOfTotal: t("pagination.pageOfTotal", {
                page: page.toLocaleString(tag),
                total: totalPages.toLocaleString(tag),
              }),
              totalItems: t("pagination.totalItems", {
                count: tripCount.toLocaleString(tag),
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}
