"use client";

import { useEffect, useState } from "react";

import { AlertIcon, CheckIcon, CloseIcon } from "@/components/icons";

type Variant = "success" | "error";

// One-shot flags pages use to trigger a toast after a redirect.
const FLASH_PARAMS = [
  "saved",
  "updated",
  "deleted",
  "error",
  "passwordUpdated",
  "emailUpdated",
  "assigned",
  "unassigned",
];

export function Toast({
  message,
  variant = "success",
  autoDismissMs = 4000,
}: {
  message: string;
  variant?: Variant;
  autoDismissMs?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Drop the flash flag from the URL so a refresh or share doesn't replay
    // the toast. Next.js keeps its router in sync with replaceState.
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of FLASH_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  useEffect(() => {
    if (!autoDismissMs) return;
    const id = window.setTimeout(() => setVisible(false), autoDismissMs);
    return () => window.clearTimeout(id);
  }, [autoDismissMs]);

  if (!visible) return null;

  const isSuccess = variant === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className="animate-toast-in fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.25rem)] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-zinc-900 py-3 pr-2 pl-4 text-sm text-white shadow-xl shadow-zinc-900/20 md:inset-x-auto md:top-5 md:right-6"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isSuccess ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {isSuccess ? (
          <CheckIcon width={14} height={14} strokeWidth={2.6} />
        ) : (
          <AlertIcon width={14} height={14} strokeWidth={2.4} />
        )}
      </span>
      <span className="flex-1 font-medium">{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
