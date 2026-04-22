"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { createVehicleAction, type VehicleFormState } from "../actions";

const initialState: VehicleFormState = {};

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

export type VehicleFormLabels = {
  name: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  currentOdometer: string;
  save: string;
  saving: string;
  cancel: string;
};

export function VehicleForm({ labels }: { labels: VehicleFormLabels }) {
  const [state, action] = useActionState(createVehicleAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field name="name" label={labels.name} required placeholder="Van A" />
        <Field name="licensePlate" label={labels.licensePlate} placeholder="ABC-123" />
        <Field name="make" label={labels.make} placeholder="Ford" />
        <Field name="model" label={labels.model} placeholder="Transit" />
        <Field name="year" label={labels.year} type="number" placeholder="2022" />
        <Field
          name="currentOdometer"
          label={labels.currentOdometer}
          type="number"
          min={0}
          step="1"
          placeholder="0"
          selectOnFocus
        />
      </div>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Submit label={labels.save} pendingLabel={labels.saving} />
        <Link
          href="/vehicles"
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
  placeholder,
  defaultValue,
  min,
  step,
  selectOnFocus,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  min?: number;
  step?: string;
  selectOnFocus?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        step={step}
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
