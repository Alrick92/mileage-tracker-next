"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  adminSetPasswordAction,
  adminUpdateEmailAction,
  type AdminActionState,
} from "../../actions";

const initialState: AdminActionState = {};

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

export function AdminEmailForm({
  userId,
  defaultEmail,
  labels,
}: {
  userId: string;
  defaultEmail: string;
  labels: {
    newLabel: string;
    save: string;
    saving: string;
  };
}) {
  const [state, action] = useActionState(adminUpdateEmailAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label
          htmlFor="adminEmail"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.newLabel}
        </label>
        <input
          id="adminEmail"
          name="email"
          type="email"
          defaultValue={defaultEmail}
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
  );
}

export function AdminPasswordForm({
  userId,
  labels,
}: {
  userId: string;
  labels: {
    newLabel: string;
    confirmLabel: string;
    save: string;
    saving: string;
  };
}) {
  const [state, action] = useActionState(adminSetPasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label
          htmlFor="adminNewPassword"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.newLabel}
        </label>
        <input
          id="adminNewPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>
      <div>
        <label
          htmlFor="adminConfirmPassword"
          className="block text-sm font-medium text-zinc-700"
        >
          {labels.confirmLabel}
        </label>
        <input
          id="adminConfirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
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
  );
}
