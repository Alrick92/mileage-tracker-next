import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import { formatDistance, formatOdometer } from "@/lib/units";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { Pagination } from "@/app/(app)/_components/Pagination";

export const metadata = {
  title: "Dashboard · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { page: pageRaw } = await searchParams;

  const assignmentFilter = {
    assignments: { some: { userId: user.id } },
  } as const;

  const [vehicleCount, tripCount, totalDistance, fleetOdometerRow] =
    await Promise.all([
      prisma.vehicle.count({ where: assignmentFilter }),
      prisma.trip.count({ where: { userId: user.id } }),
      prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
        FROM "Trip"
        WHERE "userId" = ${user.id}
      `,
      prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM(v."currentOdometer"), 0)::bigint AS sum
        FROM "Vehicle" v
        WHERE EXISTS (
          SELECT 1 FROM "VehicleAssignment" va
          WHERE va."vehicleId" = v."id" AND va."userId" = ${user.id}
        )
      `,
    ]);

  const totalPages = computeTotalPages(vehicleCount);
  const page = parsePage(pageRaw, totalPages);

  const vehicles = await prisma.vehicle.findMany({
    where: assignmentFilter,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { trips: true } },
    },
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  const distanceTotalKm = Number(totalDistance[0]?.sum ?? 0);
  const fleetOdometerKm = Number(fleetOdometerRow[0]?.sum ?? 0);
  const tag = localeTag(user.locale);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {t("dashboard.addVehicle")}
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.stat.vehicles")}
          value={vehicleCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("dashboard.stat.trips")}
          value={tripCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("dashboard.stat.distance")}
          value={formatDistance(distanceTotalKm, user.unit, user.locale)}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("dashboard.vehiclesHeading")}
          </h2>
          <p className="text-xs text-zinc-500">
            {t("dashboard.fleetOdometerTotal")}{" "}
            <span className="font-mono text-zinc-900">
              {formatOdometer(fleetOdometerKm, user.unit, user.locale)}
            </span>
          </p>
        </div>

        {vehicleCount === 0 ? (
          <EmptyVehicles
            title={t("dashboard.empty.title")}
            subtitle={t("dashboard.empty.subtitle")}
            cta={t("dashboard.addVehicle")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("dashboard.col.vehicle")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("dashboard.col.plate")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("dashboard.col.trips")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {t("dashboard.col.currentOdometer")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">
                          {v.name}
                        </div>
                        {v.make || v.model ? (
                          <div className="text-xs text-zinc-500">
                            {[v.year, v.make, v.model]
                              .filter(Boolean)
                              .join(" ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                        {v.licensePlate ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {v._count.trips}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-900">
                        {formatOdometer(
                          v.currentOdometer,
                          user.unit,
                          user.locale,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="text-xs font-medium text-zinc-900 underline-offset-4 hover:underline"
                        >
                          {t("common.view")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={vehicleCount}
              basePath="/dashboard"
              labels={{
                previous: t("pagination.previous"),
                next: t("pagination.next"),
                pageOfTotal: t("pagination.pageOfTotal", {
                  page: page.toLocaleString(tag),
                  total: totalPages.toLocaleString(tag),
                }),
                totalItems: t("pagination.totalItems", {
                  count: vehicleCount.toLocaleString(tag),
                }),
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
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

function EmptyVehicles({
  title,
  subtitle,
  cta,
}: {
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      <Link
        href="/vehicles/new"
        className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {cta}
      </Link>
    </div>
  );
}
