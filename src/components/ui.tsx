import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronLeftIcon } from "./icons";

/**
 * Shared button styles. Every variant meets the 44px minimum touch target on
 * small screens and shrinks to a denser size from `md` up.
 */
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 md:min-h-9 md:rounded-lg";

export const buttonStyles = {
  primary: `${buttonBase} bg-zinc-900 text-white shadow-sm hover:bg-zinc-800`,
  secondary: `${buttonBase} border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50 hover:text-zinc-900`,
  danger: `${buttonBase} bg-red-600 text-white shadow-sm hover:bg-red-700`,
  dangerOutline: `${buttonBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`,
  ghost: `${buttonBase} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900`,
} as const;

export const inputStyles =
  "mt-1.5 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-900 shadow-xs transition placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 md:rounded-lg md:py-2";

export const cardStyles =
  "rounded-2xl border border-zinc-200/80 bg-white shadow-xs";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-9 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
    >
      <ChevronLeftIcon width={16} height={16} />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {back ? <BackLink href={back.href} label={back.label} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-[1.7rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`${cardStyles} p-4 md:p-5 ${className}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1.5 truncate font-mono text-xl font-semibold tracking-tight text-zinc-900 md:mt-2 md:text-2xl">
        {value}
      </p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg"
      ? "h-12 w-12 rounded-2xl text-base"
      : size === "sm"
        ? "h-7 w-7 rounded-lg text-[10px]"
        : "h-8 w-8 rounded-lg text-xs";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-zinc-900 font-mono font-bold text-white shadow-sm ${dims}`}
    >
      MT
    </span>
  );
}
