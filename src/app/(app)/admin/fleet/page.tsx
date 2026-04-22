import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import { formatDistance, formatOdometer, unitShort } from "@/lib/units";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { Pagination } from "@/app/(app)/_components/Pagination";

export const metadata = {
  title: "Fleet · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ vp?: string; tp?: string }>;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AdminFleetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = await requireAdmin();
  const t = translator(admin.locale);
  const unit = admin.unit;
  const locale = admin.locale;
  const { vp: vpRaw, tp: tpRaw } = await searchParams;

  const [vehicleCount, tripCount, totalDistance, userCount] = await Promise.all(
    [
      prisma.vehicle.count(),
      prisma.trip.count(),
      prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
        FROM "Trip"
      `,
      prisma.user.count(),
    ],
  );

  const vehicleTotalPages = computeTotalPages(vehicleCount);
  const tripTotalPages = computeTotalPages(tripCount);
  const vehiclePage = parsePage(vpRaw, vehicleTotalPages);
  const tripPage = parsePage(tpRaw, tripTotalPages);

  const [vehicles, trips] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: [{ user: { name: "asc" } }, { name: "asc" }],
      include: {
        _count: { select: { trips: true } },
        user: { select: { name: true, email: true } },
      },
      skip: computeSkip(vehiclePage),
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.trip.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        vehicle: { select: { name: true, licensePlate: true } },
        user: { select: { name: true, email: true } },
      },
      skip: computeSkip(tripPage),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const distanceTotalKm = Number(totalDistance[0]?.sum ?? 0);
  const tag = localeTag(locale);

  const tripParamPreserve = vpRaw ? { vp: vpRaw } : {};
  const vehicleParamPreserve = tpRaw ? { tp: tpRaw } : {};

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.fleet.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("admin.fleet.subtitle")}
          </p>
        </div>
        <a
          href="/api/trips/export?all=1"
          className="inline-flex w-fit items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          {t("admin.fleet.exportAll")}
        </a>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label={t("admin.col.user")}
          value={userCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("admin.fleet.vehicles")}
          value={vehicleCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("admin.fleet.trips")}
          value={tripCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("admin.fleet.distance")}
          value={formatDistance(distanceTotalKm, unit, locale)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.fleet.vehicles")}
        </h2>
        {vehicleCount === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            {t("dashboard.empty.title")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("dashboard.col.vehicle")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("admin.fleet.owner")}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{v.name}</div>
                        {v.make || v.model ? (
                          <div className="text-xs text-zinc-500">
                            {[v.year, v.make, v.model]
                              .filter(Boolean)
                              .join(" ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-900">{v.user.name}</div>
                        <div className="font-mono text-xs text-zinc-500">
                          {v.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                        {v.licensePlate ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {v._count.trips}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-900">
                        {formatOdometer(v.currentOdometer, unit, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={vehiclePage}
              totalPages={vehicleTotalPages}
              total={vehicleCount}
              basePath="/admin/fleet"
              paramName="vp"
              otherParams={vehicleParamPreserve}
              labels={{
                previous: t("pagination.previous"),
                next: t("pagination.next"),
                pageOfTotal: t("pagination.pageOfTotal", {
                  page: vehiclePage.toLocaleString(tag),
                  total: vehicleTotalPages.toLocaleString(tag),
                }),
                totalItems: t("pagination.totalItems", {
                  count: vehicleCount.toLocaleString(tag),
                }),
              }}
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.fleet.trips")}
        </h2>
        {tripCount === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            {t("trips.empty.title")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("trips.col.date")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("trips.col.vehicle")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("admin.fleet.owner")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("trips.col.driver")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {t("trips.col.distance")} ({unitShort(unit, locale)})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                        {formatDate(trip.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">
                          {trip.vehicle.name}
                        </div>
                        {trip.vehicle.licensePlate ? (
                          <div className="font-mono text-xs text-zinc-500">
                            {trip.vehicle.licensePlate}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-900">{trip.user.name}</div>
                        <div className="font-mono text-xs text-zinc-500">
                          {trip.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {trip.driverName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                        {formatDistance(
                          trip.endOdometer - trip.startOdometer,
                          unit,
                          locale,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={tripPage}
              totalPages={tripTotalPages}
              total={tripCount}
              basePath="/admin/fleet"
              paramName="tp"
              otherParams={tripParamPreserve}
              labels={{
                previous: t("pagination.previous"),
                next: t("pagination.next"),
                pageOfTotal: t("pagination.pageOfTotal", {
                  page: tripPage.toLocaleString(tag),
                  total: tripTotalPages.toLocaleString(tag),
                }),
                totalItems: t("pagination.totalItems", {
                  count: tripCount.toLocaleString(tag),
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
