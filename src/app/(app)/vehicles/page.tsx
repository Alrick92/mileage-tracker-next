import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Vehicles · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  await requireUser();

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { trips: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your fleet and current odometer readings.
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add vehicle
        </Link>
      </header>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">No vehicles yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Add a vehicle to begin logging trips.
          </p>
        </div>
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
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                    {v.licensePlate ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{v._count.trips}</td>
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
    </div>
  );
}
