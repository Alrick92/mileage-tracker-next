"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateEmailAction, type UpdateEmailState } from "./actions";

const initialState: UpdateEmailState = {};

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

export function EmailForm({
  defaultEmail,
  labels,
}: {
  defaultEmail: string;
  labels: {
    heading: string;
    subtitle: string;
    currentLabel: string;
    newLabel: string;
    currentPasswordLabel: string;
    save: string;
    saving: string;
  };
}) {
  const [state, action] = useActionState(updateEmailAction, initialState);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {labels.heading}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{labels.subtitle}</p>
      </div>
      <dl className="rounded-lg bg-zinc-50 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500">{labels.currentLabel}</dt>
          <dd className="font-mono text-xs text-zinc-900">{defaultEmail}</dd>
        </div>
      </dl>
      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            {labels.newLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="currentPasswordEmail"
            className="block text-sm font-medium text-zinc-700"
          >
            {labels.currentPasswordLabel}
          </label>
          <input
            id="currentPasswordEmail"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        {state.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        <Submit label={labels.save} pendingLabel={labels.saving} />
      </form>
    </div>
  );
}
