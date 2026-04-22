"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { createTripAction, type TripFormState } from "./actions";

export type TripFormVehicle = {
  id: string;
  name: string;
  licensePlate: string | null;
  currentOdometerDisplay: string;
  // Default start odometer in the user's unit, taken from the most recent
  // trip's end odometer (or the vehicle's current odometer if no trips).
  defaultStartOdometer: number;
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
  startPrefillHelp: string;
  distance: string;
  distanceUnit: string;
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
  vehicles: TripFormVehicle[];
  defaultVehicleId?: string;
  defaultDriverName?: string;
  labels: TripFormLabels;
}) {
  const [state, action] = useActionState(createTripAction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  const vehiclesById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles],
  );

  const initialVehicleId = defaultVehicleId ?? "";
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [startOdometer, setStartOdometer] = useState<string>(
    initialVehicleId && vehiclesById[initialVehicleId]
      ? String(vehiclesById[initialVehicleId].defaultStartOdometer)
      : "",
  );
  const [endOdometer, setEndOdometer] = useState<string>("");

  const distancePreview = useMemo(() => {
    const start = Number(startOdometer);
    const end = Number(endOdometer);
    if (
      startOdometer === "" ||
      endOdometer === "" ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end < start
    ) {
      return null;
    }
    return end - start;
  }, [startOdometer, endOdometer]);

  function onVehicleChange(id: string) {
    setSelectedVehicleId(id);
    const v = vehiclesById[id];
    if (v) {
      setStartOdometer(String(v.defaultStartOdometer));
    } else {
      setStartOdometer("");
    }
  }

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
            value={selectedVehicleId}
            onChange={(e) => onVehicleChange(e.target.value)}
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
        <div>
          <label
            htmlFor="startOdometer"
            className="block text-sm font-medium text-zinc-700"
          >
            {labels.startOdometer}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            id="startOdometer"
            name="startOdometer"
            type="number"
            required
            min={0}
            step="1"
            value={startOdometer}
            onChange={(e) => setStartOdometer(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">{labels.startPrefillHelp}</p>
        </div>
        <div>
          <label
            htmlFor="endOdometer"
            className="block text-sm font-medium text-zinc-700"
          >
            {labels.endOdometer}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            id="endOdometer"
            name="endOdometer"
            type="number"
            required
            min={0}
            step="1"
            value={endOdometer}
            onChange={(e) => setEndOdometer(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <p
            className="mt-1 text-xs text-zinc-500"
            aria-live="polite"
          >
            {labels.distance}:{" "}
            <span className="font-mono text-zinc-900">
              {distancePreview === null
                ? "—"
                : `${distancePreview.toLocaleString()} ${labels.distanceUnit}`}
            </span>
          </p>
        </div>
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
        onFocus={selectOnFocus ? (e) => e.currentTarget.select() : undefined}
        className={`mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 ${
          type === "number" ? "font-mono" : ""
        }`}
      />
    </div>
  );
}
