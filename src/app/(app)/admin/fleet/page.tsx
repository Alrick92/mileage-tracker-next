import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import { formatDistance, formatOdometer, unitShort } from "@/lib/units";

export const metadata = {
  title: "Fleet · Mileage Tracker",
};

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AdminFleetPage() {
  const admin = await requireAdmin();
  const t = translator(admin.locale);
  const unit = admin.unit;
  const locale = admin.locale;

  const [vehicles, trips, totalDistance, tripCount, userCount] =
    await Promise.all([
      prisma.vehicle.findMany({
        orderBy: [{ user: { name: "asc" } }, { name: "asc" }],
        include: {
          _count: { select: { trips: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.trip.findMany({
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 100,
        include: {
          vehicle: { select: { name: true, licensePlate: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
        FROM "Trip"
      `,
      prisma.trip.count(),
      prisma.user.count(),
    ]);

  const distanceTotalKm = Number(totalDistance[0]?.sum ?? 0);

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
          value={userCount.toLocaleString(localeTag(locale))}
        />
        <StatCard
          label={t("admin.fleet.vehicles")}
          value={vehicles.length.toLocaleString(localeTag(locale))}
        />
        <StatCard
          label={t("admin.fleet.trips")}
          value={tripCount.toLocaleString(localeTag(locale))}
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
        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            {t("dashboard.empty.title")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
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
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.fleet.trips")}
        </h2>
        {trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            {t("trips.empty.title")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
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
