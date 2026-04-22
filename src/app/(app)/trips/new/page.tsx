import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

import { TripForm } from "../TripForm";

export const metadata = {
  title: "Log trip · Mileage Tracker",
};

type SearchParams = Promise<{ vehicleId?: string }>;

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const { vehicleId } = await searchParams;

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      licensePlate: true,
      currentOdometer: true,
    },
  });

  if (vehicles.length === 0) {
    redirect("/vehicles/new");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/trips"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← Back to trips
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Log trip</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Record a new trip for a vehicle in your fleet.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <TripForm
          vehicles={vehicles}
          defaultVehicleId={vehicleId}
          defaultDriverName={user.name}
        />
      </div>
    </div>
  );
}
