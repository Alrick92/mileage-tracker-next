"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { createTripAction, type TripFormState } from "./actions";

type Vehicle = {
  id: string;
  name: string;
  licensePlate: string | null;
  currentOdometer: number;
};

const initialState: TripFormState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Log trip"}
    </button>
  );
}

export function TripForm({
  vehicles,
  defaultVehicleId,
  defaultDriverName,
}: {
  vehicles: Vehicle[];
  defaultVehicleId?: string;
  defaultDriverName?: string;
}) {
  const [state, action] = useActionState(createTripAction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="vehicleId"
            className="block text-sm font-medium text-zinc-700"
          >
            Vehicle <span className="text-red-500">*</span>
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            required
            defaultValue={defaultVehicleId ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="" disabled>
              Select a vehicle…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.licensePlate ? ` (${v.licensePlate})` : ""} · last{" "}
                {v.currentOdometer.toLocaleString()} km
              </option>
            ))}
          </select>
        </div>

        <Field
          name="date"
          label="Date"
          type="date"
          required
          defaultValue={today}
        />
        <Field
          name="driverName"
          label="Driver"
          required
          defaultValue={defaultDriverName}
        />
        <Field
          name="startOdometer"
          label="Start odometer (km)"
          type="number"
          required
          min={0}
        />
        <Field
          name="endOdometer"
          label="End odometer (km)"
          type="number"
          required
          min={0}
        />
        <Field
          name="fuelLiters"
          label="Fuel used (L)"
          type="number"
          step="0.01"
          min={0}
        />
        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-zinc-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Submit />
        <Link
          href="/trips"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  min,
  step,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        step={step}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
      />
    </div>
  );
}
