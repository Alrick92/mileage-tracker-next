"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  setEnabledAction,
  setRoleAction,
  type AdminActionState,
} from "./actions";

const initialState: AdminActionState = {};

function PendingButton({
  children,
  destructive,
}: {
  children: React.ReactNode;
  destructive?: boolean;
}) {
  const { pending } = useFormStatus();
  const base = destructive
    ? "rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
    : "rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100";
  return (
    <button type="submit" disabled={pending} className={`${base} disabled:opacity-60`}>
      {children}
    </button>
  );
}

export function EnabledToggleForm({
  userId,
  enabled,
  labels,
  isSelf,
}: {
  userId: string;
  enabled: boolean;
  labels: { enable: string; disable: string };
  isSelf: boolean;
}) {
  const [, action] = useActionState(setEnabledAction, initialState);
  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="userId" value={userId} />
      <input
        type="hidden"
        name="enabled"
        value={enabled ? "false" : "true"}
      />
      {enabled ? (
        <PendingButton destructive>
          {isSelf ? "—" : labels.disable}
        </PendingButton>
      ) : (
        <PendingButton>{labels.enable}</PendingButton>
      )}
    </form>
  );
}

export function RoleToggleForm({
  userId,
  role,
  labels,
  isSelf,
}: {
  userId: string;
  role: "USER" | "ADMIN";
  labels: { promote: string; demote: string };
  isSelf: boolean;
}) {
  const [, action] = useActionState(setRoleAction, initialState);
  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="userId" value={userId} />
      <input
        type="hidden"
        name="role"
        value={role === "ADMIN" ? "USER" : "ADMIN"}
      />
      {role === "ADMIN" ? (
        <PendingButton destructive>
          {isSelf ? "—" : labels.demote}
        </PendingButton>
      ) : (
        <PendingButton>{labels.promote}</PendingButton>
      )}
    </form>
  );
}
