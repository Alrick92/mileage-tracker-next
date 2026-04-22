"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export function Sidebar({
  appTitle,
  version,
  labels,
  isAdmin,
}: {
  appTitle: string;
  version: string;
  labels: {
    dashboard: string;
    vehicles: string;
    trips: string;
    settings: string;
    admin: string;
    fleet: string;
    audit: string;
  };
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    {
      href: "/dashboard",
      label: labels.dashboard,
      match: (p) => p === "/dashboard",
    },
    {
      href: "/vehicles",
      label: labels.vehicles,
      match: (p) => p.startsWith("/vehicles"),
    },
    {
      href: "/trips",
      label: labels.trips,
      match: (p) => p.startsWith("/trips"),
    },
    {
      href: "/settings",
      label: labels.settings,
      match: (p) => p.startsWith("/settings"),
    },
  ];
  if (isAdmin) {
    nav.push({
      href: "/admin/fleet",
      label: labels.fleet,
      match: (p) => p.startsWith("/admin/fleet"),
    });
    nav.push({
      href: "/admin/users",
      label: labels.admin,
      match: (p) => p.startsWith("/admin/users"),
    });
    nav.push({
      href: "/admin/audit",
      label: labels.audit,
      match: (p) => p.startsWith("/admin/audit"),
    });
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 font-mono text-xs font-bold text-white">
            MT
          </span>
          <span className="text-sm font-semibold tracking-tight">
            {appTitle}
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                    : "block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 px-6 py-4 text-xs text-zinc-500">
          <p className="font-mono">{version}</p>
        </div>
      </aside>

      {/* Mobile top navigation strip */}
      <div className="border-b border-zinc-200 bg-white md:hidden">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-100 px-4">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 font-mono text-[10px] font-bold text-white">
            MT
          </span>
          <span className="text-sm font-semibold tracking-tight">
            {appTitle}
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                    : "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
