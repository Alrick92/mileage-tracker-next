"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { buttonStyles, inputStyles } from "@/components/ui";

import { updateEmailAction, type UpdateEmailState } from "./actions";

const initialState: UpdateEmailState = {};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonStyles.primary} w-full sm:w-auto`}
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {labels.heading}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{labels.subtitle}</p>
      </div>
      <dl className="rounded-xl bg-zinc-50 p-3.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500">{labels.currentLabel}</dt>
          <dd className="min-w-0 truncate font-mono text-xs text-zinc-900">
            {defaultEmail}
          </dd>
        </div>
      </dl>
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800"
            >
              {labels.newLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputStyles}
            />
          </div>
          <div>
            <label
              htmlFor="currentPasswordEmail"
              className="block text-sm font-medium text-zinc-800"
            >
              {labels.currentPasswordLabel}
            </label>
            <input
              id="currentPasswordEmail"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className={inputStyles}
            />
          </div>
        </div>
        {state.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        <Submit label={labels.save} pendingLabel={labels.saving} />
      </form>
    </div>
  );
}
