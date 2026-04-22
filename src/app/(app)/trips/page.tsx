import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Trips · Mileage Tracker",
};

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function TripsPage() {
  await requireUser();

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

  const totalDistance = trips.reduce(
    (acc, t) => acc + (t.endOdometer - t.startOdometer),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="mt-1 text-sm text-zinc-500">
            All logged trips across your fleet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/trips/export"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Export CSV
          </a>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Log trip
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Trips shown"
          value={trips.length.toLocaleString()}
        />
        <SummaryCard
          label="Distance"
          value={`${totalDistance.toLocaleString()} km`}
        />
      </section>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">No trips yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Log a trip to populate this table.
          </p>
          <Link
            href="/trips/new"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Log your first trip
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 text-right font-medium">Start</th>
                <th className="px-4 py-3 text-right font-medium">End</th>
                <th className="px-4 py-3 text-right font-medium">Distance</th>
                <th className="px-4 py-3 text-right font-medium">Fuel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {t.vehicle.name}
                    </div>
                    {t.vehicle.licensePlate ? (
                      <div className="font-mono text-xs text-zinc-500">
                        {t.vehicle.licensePlate}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{t.driverName}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {t.startOdometer.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {t.endOdometer.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                    {(t.endOdometer - t.startOdometer).toLocaleString()} km
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {t.fuelLiters !== null ? `${t.fuelLiters} L` : "—"}
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
