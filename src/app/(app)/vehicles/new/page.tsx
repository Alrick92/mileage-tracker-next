import Link from "next/link";

import { requireUser } from "@/lib/auth";

import { VehicleForm } from "./VehicleForm";

export const metadata = {
  title: "Add vehicle · Mileage Tracker",
};

export default async function NewVehiclePage() {
  await requireUser();
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/vehicles"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← Back to vehicles
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Add vehicle
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Register a new vehicle in your fleet.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <VehicleForm />
      </div>
    </div>
  );
}
