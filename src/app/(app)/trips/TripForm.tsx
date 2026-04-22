"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { createTripAction, type TripFormState } from "./actions";

type Vehicle = {
  id: string;
  name: string;
  licensePlate: string | null;
  currentOdometerDisplay: string;
};

const initialState: TripFormState = {};

export type TripFormLabels = {
  vehicle: string;
  vehicleSelect: string;
  vehicleOptionLast: string;
  date: string;
  driver: string;
  startOdometer: string;
  endOdometer: string;
  fuel: string;
  notes: string;
  save: string;
  saving: string;
  cancel: string;
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function TripForm({
  vehicles,
  defaultVehicleId,
  defaultDriverName,
  labels,
}: {
  vehicles: Vehicle[];
  defaultVehicleId?: string;
  defaultDriverName?: string;
  labels: TripFormLabels;
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
            {labels.vehicle} <span className="text-red-500">*</span>
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            required
            defaultValue={defaultVehicleId ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="" disabled>
              {labels.vehicleSelect}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.licensePlate ? ` (${v.licensePlate})` : ""} ·{" "}
                {labels.vehicleOptionLast} {v.currentOdometerDisplay}
              </option>
            ))}
          </select>
        </div>

        <Field
          name="date"
          label={labels.date}
          type="date"
          required
          defaultValue={today}
        />
        <Field
          name="driverName"
          label={labels.driver}
          required
          defaultValue={defaultDriverName}
        />
        <Field
          name="startOdometer"
          label={labels.startOdometer}
          type="number"
          required
          min={0}
          step="1"
          selectOnFocus
        />
        <Field
          name="endOdometer"
          label={labels.endOdometer}
          type="number"
          required
          min={0}
          step="1"
          selectOnFocus
        />
        <Field
          name="fuelLiters"
          label={labels.fuel}
          type="number"
          step="0.01"
          min={0}
        />
        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-zinc-700"
          >
            {labels.notes}
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
        <Submit label={labels.save} pendingLabel={labels.saving} />
        <Link
          href="/trips"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          {labels.cancel}
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
  selectOnFocus,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  step?: string;
  defaultValue?: string;
  selectOnFocus?: boolean;
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
        onFocus={
          selectOnFocus
            ? (event) => event.currentTarget.select()
            : undefined
        }
        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
      />
    </div>
  );
}
