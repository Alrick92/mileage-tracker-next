"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  importTripsAction,
  type ImportTripsState,
} from "./actions";

export type ImportFormLabels = {
  vehicle: string;
  vehiclePlaceholder: string;
  vehicleHelp: string;
  vehicleEmpty: string;
  chooseFile: string;
  fileHelp: string;
  submit: string;
  submitting: string;
  cancel: string;
  resultImported: string;
  resultSkipped: string;
  resultErrorsHeading: string;
  rowLabel: string;
};

export type ImportFormVehicleOption = {
  id: string;
  name: string;
  licensePlate: string | null;
};

export function ImportForm({
  labels,
  vehicles,
}: {
  labels: ImportFormLabels;
  vehicles: ImportFormVehicleOption[];
}) {
  const [state, formAction, pending] = useActionState<
    ImportTripsState,
    FormData
  >(importTripsAction, {});

  const hasResult =
    typeof state.imported === "number" || typeof state.skipped === "number";
  const hasVehicles = vehicles.length > 0;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="vehicleId"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.vehicle}
          <span className="ml-0.5 text-red-500">*</span>
        </label>
        <select
          id="vehicleId"
          name="vehicleId"
          required
          disabled={!hasVehicles}
          defaultValue=""
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
        >
          <option value="" disabled>
            {labels.vehiclePlaceholder}
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.licensePlate ? `${v.name} (${v.licensePlate})` : v.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {hasVehicles ? labels.vehicleHelp : labels.vehicleEmpty}
        </p>
      </div>

      <div>
        <label
          htmlFor="file"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.chooseFile}
          <span className="ml-0.5 text-red-500">*</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="mt-1 block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500">{labels.fileHelp}</p>
      </div>

      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {hasResult ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {labels.resultImported.replace(
              "{count}",
              String(state.imported ?? 0),
            )}
            {(state.skipped ?? 0) > 0
              ? ` · ${labels.resultSkipped.replace(
                  "{count}",
                  String(state.skipped ?? 0),
                )}`
              : ""}
          </div>

          {state.rowErrors && state.rowErrors.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
              <div className="border-b border-amber-200 bg-amber-100/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
                {labels.resultErrorsHeading}
              </div>
              <ul className="divide-y divide-amber-200">
                {state.rowErrors.map((err) => (
                  <li
                    key={`${err.row}-${err.message}`}
                    className="px-3 py-2 text-sm text-amber-900"
                  >
                    <span className="font-mono text-xs text-amber-700">
                      {labels.rowLabel} {err.row}
                    </span>
                    <span className="mx-2 text-amber-400">—</span>
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending || !hasVehicles}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? labels.submitting : labels.submit}
        </button>
        <Link
          href="/trips"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
