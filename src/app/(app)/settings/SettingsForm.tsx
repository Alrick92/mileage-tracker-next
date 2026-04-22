"use client";

import { useActionState, useState } from "react";
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
  // Adjust local state when the server-rendered preferences change (e.g.
  // after a successful save revalidates the page). An uncontrolled
  // `defaultValue` only applies on mount and would leave the dropdown showing
  // the pre-save value on subsequent renders — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [savedUnit, setSavedUnit] = useState<"KM" | "MI">(defaultUnit);
  const [savedLocale, setSavedLocale] = useState<"EN" | "FR">(defaultLocale);
  const [unit, setUnit] = useState<"KM" | "MI">(defaultUnit);
  const [locale, setLocale] = useState<"EN" | "FR">(defaultLocale);
  if (defaultUnit !== savedUnit) {
    setSavedUnit(defaultUnit);
    setUnit(defaultUnit);
  }
  if (defaultLocale !== savedLocale) {
    setSavedLocale(defaultLocale);
    setLocale(defaultLocale);
  }
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
          value={unit}
          onChange={(e) => setUnit(e.target.value as "KM" | "MI")}
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
          value={locale}
          onChange={(e) => setLocale(e.target.value as "EN" | "FR")}
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
