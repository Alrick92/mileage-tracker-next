"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { buttonStyles, inputStyles } from "@/components/ui";

import { createVehicleAction, type VehicleFormState } from "../actions";

const initialState: VehicleFormState = {};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonStyles.primary} min-h-12 flex-1 text-base md:min-h-10 md:flex-none md:text-sm`}
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
        <Field name="name" label={labels.name} required placeholder="Van A" autoCapitalize="words" />
        <Field
          name="licensePlate"
          label={labels.licensePlate}
          placeholder="ABC-123"
          autoCapitalize="characters"
        />
        <Field name="make" label={labels.make} placeholder="Ford" />
        <Field name="model" label={labels.model} placeholder="Transit" />
        <Field
          name="year"
          label={labels.year}
          type="number"
          inputMode="numeric"
          placeholder="2022"
        />
        <Field
          name="currentOdometer"
          label={labels.currentOdometer}
          type="number"
          inputMode="numeric"
          min={0}
          step="1"
          placeholder="0"
          selectOnFocus
        />
      </div>
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      {/* Sticky on mobile so the save button stays within thumb reach. */}
      <div className="pb-safe sticky bottom-0 z-10 -mx-4 -mb-4 rounded-b-2xl border-t border-zinc-200/70 bg-white/90 px-4 pt-3 backdrop-blur-xl sm:-mx-6 sm:-mb-6 sm:px-6 md:static md:m-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="flex items-center gap-3 pb-3 md:pb-0">
          <Link href="/vehicles" className={buttonStyles.ghost}>
            {labels.cancel}
          </Link>
          <Submit label={labels.save} pendingLabel={labels.saving} />
        </div>
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
  inputMode,
  autoCapitalize,
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
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoCapitalize?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-800"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        ) : null}
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
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        onFocus={
          selectOnFocus
            ? (event) => event.currentTarget.select()
            : undefined
        }
        className={`${inputStyles} ${type === "number" ? "font-mono tabular-nums" : ""}`}
      />
    </div>
  );
}
