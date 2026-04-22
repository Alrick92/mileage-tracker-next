import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Dashboard · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();

  const [vehicles, tripCount, totalDistance] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { trips: true } },
      },
    }),
    prisma.trip.count(),
    prisma.$queryRaw<{ sum: bigint | null }[]>`
      SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
      FROM "Trip"
    `,
  ]);

  const distanceTotal = Number(totalDistance[0]?.sum ?? 0);
  const fleetOdometer = vehicles.reduce((acc, v) => acc + v.currentOdometer, 0);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Overview of your fleet and recent activity.
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add vehicle
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Vehicles" value={vehicles.length.toLocaleString()} />
        <StatCard label="Trips logged" value={tripCount.toLocaleString()} />
        <StatCard
          label="Distance tracked"
          value={`${distanceTotal.toLocaleString()} km`}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Vehicles
          </h2>
          <p className="text-xs text-zinc-500">
            Fleet odometer total:{" "}
            <span className="font-mono text-zinc-900">
              {fleetOdometer.toLocaleString()} km
            </span>
          </p>
        </div>

        {vehicles.length === 0 ? (
          <EmptyVehicles />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Plate</th>
                  <th className="px-4 py-3 font-medium">Trips</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Current odometer
                  </th>
                  <th className="px-4 py-3" />
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
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      {v.licensePlate ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {v._count.trips}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-900">
                      {v.currentOdometer.toLocaleString()} km
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="text-xs font-medium text-zinc-900 underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
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

function EmptyVehicles() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <p className="text-sm font-medium text-zinc-900">No vehicles yet</p>
      <p className="mt-1 text-sm text-zinc-500">
        Add a vehicle to begin logging trips.
      </p>
      <Link
        href="/vehicles/new"
        className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Add your first vehicle
      </Link>
    </div>
  );
}
