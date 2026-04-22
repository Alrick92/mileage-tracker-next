"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p) => p === "/dashboard",
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    match: (p) => p.startsWith("/vehicles"),
  },
  {
    href: "/trips",
    label: "Trips",
    match: (p) => p.startsWith("/trips"),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 font-mono text-xs font-bold text-white">
          MT
        </span>
        <span className="text-sm font-semibold tracking-tight">
          Mileage Tracker
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map((item) => {
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
        <p className="font-mono">v0.1.0</p>
      </div>
    </aside>
  );
}
