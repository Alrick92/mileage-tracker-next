"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PlusIcon } from "@/components/icons";
import { Logo } from "@/components/ui";

import { buildNav, type NavItem, type NavLabels } from "./nav";

/** Desktop-only sidebar. Mobile navigation lives in MobileNav. */
export function Sidebar({
  appTitle,
  version,
  labels,
  logTripLabel,
  adminHeading,
  isAdmin,
}: {
  appTitle: string;
  version: string;
  labels: NavLabels;
  logTripLabel: string;
  adminHeading: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const { main, admin } = buildNav(labels, isAdmin);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Logo />
        <span className="text-sm font-semibold tracking-tight">{appTitle}</span>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/trips/new"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
        >
          <PlusIcon width={16} height={16} />
          {logTripLabel}
        </Link>
      </div>

      <nav aria-label={appTitle} className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {main.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
        {admin.length > 0 ? (
          <>
            <p className="mt-6 px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {adminHeading}
            </p>
            <ul className="space-y-0.5">
              {admin.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>
          </>
        ) : null}
      </nav>

      <div className="border-t border-zinc-100 px-5 py-4 text-xs text-zinc-400">
        <p className="font-mono">{version}</p>
      </div>
    </aside>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        }`}
      >
        <Icon
          width={18}
          height={18}
          className={active ? "text-zinc-900" : "text-zinc-400"}
        />
        {item.label}
      </Link>
    </li>
  );
}
