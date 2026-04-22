import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import {
  formatDistance,
  formatOdometerNumber,
  unitShort,
} from "@/lib/units";

export const metadata = {
  title: "Trips · Mileage Tracker",
};

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function TripsPage() {
  const user = await requireUser();
  const t = translator(user.locale);
  const unit = user.unit;
  const locale = user.locale;

  const trips = await prisma.trip.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      vehicle: {
        select: { id: true, name: true, licensePlate: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
    take: 200,
  });

  const totalDistanceKm = trips.reduce(
    (acc, trip) => acc + (trip.endOdometer - trip.startOdometer),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("trips.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t("trips.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/trips/export"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {t("trips.exportCsv")}
          </a>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {t("trips.logTrip")}
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          label={t("trips.summary.shown")}
          value={trips.length.toLocaleString(localeTag(locale))}
        />
        <SummaryCard
          label={t("trips.summary.distance")}
          value={formatDistance(totalDistanceKm, unit, locale)}
        />
      </section>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">
            {t("trips.empty.title")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t("trips.empty.subtitle")}
          </p>
          <Link
            href="/trips/new"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {t("trips.empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("trips.col.date")}</th>
                <th className="px-4 py-3 font-medium">
                  {t("trips.col.vehicle")}
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
                <th className="px-4 py-3 text-right font-medium">
                  {t("trips.col.fuel")}
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
                  <td className="px-4 py-3 text-zinc-700">{trip.driverName}</td>
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
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {trip.fuelLiters !== null ? `${trip.fuelLiters} L` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
