"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updatePreferencesAction,
  type SettingsFormState,
} from "./actions";

const initialState: SettingsFormState = {};

export type SettingsFormLabels = {
  unitLabel: string;
  unitHelp: string;
  km: string;
  mi: string;
  localeLabel: string;
  localeHelp: string;
  english: string;
  french: string;
  save: string;
  saving: string;
  saved: string;
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

export function SettingsForm({
  defaultUnit,
  defaultLocale,
  labels,
}: {
  defaultUnit: "KM" | "MI";
  defaultLocale: "EN" | "FR";
  labels: SettingsFormLabels;
}) {
  const [state, action] = useActionState(
    updatePreferencesAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-5">
      <div>
        <label
          htmlFor="unit"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.unitLabel}
        </label>
        <select
          id="unit"
          name="unit"
          defaultValue={defaultUnit}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="MI">{labels.mi}</option>
          <option value="KM">{labels.km}</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500">{labels.unitHelp}</p>
      </div>
      <div>
        <label
          htmlFor="locale"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.localeLabel}
        </label>
        <select
          id="locale"
          name="locale"
          defaultValue={defaultLocale}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="EN">{labels.english}</option>
          <option value="FR">{labels.french}</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500">{labels.localeHelp}</p>
      </div>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {labels.saved}
        </p>
      ) : null}
      <Submit label={labels.save} pendingLabel={labels.saving} />
    </form>
  );
}
