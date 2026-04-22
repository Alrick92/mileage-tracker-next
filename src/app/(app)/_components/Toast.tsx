"use client";

import { useEffect, useState } from "react";

type Variant = "success" | "error";

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
    if (!autoDismissMs) return;
    const id = window.setTimeout(() => setVisible(false), autoDismissMs);
    return () => window.clearTimeout(id);
  }, [autoDismissMs]);

  if (!visible) return null;

  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm shadow-sm ${styles}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="rounded px-2 text-xs font-semibold opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
