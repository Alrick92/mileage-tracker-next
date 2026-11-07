"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { buttonStyles, inputStyles } from "@/components/ui";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonStyles.primary} min-h-12 w-full text-base md:min-h-11 md:text-sm`}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-800"
        >
          Email
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
          htmlFor="password"
          className="block text-sm font-medium text-zinc-800"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputStyles}
        />
      </div>
      {state.error ? (
        <p
          role="alert"
          className={
            state.pending
              ? "rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
              : "rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          }
        >
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
