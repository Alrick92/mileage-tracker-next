"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { logoutAction } from "@/app/actions/auth";
import {
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  UploadIcon,
} from "@/components/icons";
import { Logo } from "@/components/ui";

import { buildNav, isFocusRoute, type NavItem, type NavLabels } from "./nav";

type MobileUser = {
  name: string;
  email: string;
  isAdmin: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/** Compact sticky header shown on small screens only. */
export function MobileHeader({
  appTitle,
  user,
  settingsLabel,
}: {
  appTitle: string;
  user: MobileUser;
  settingsLabel: string;
}) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl backdrop-saturate-150 md:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link
          href="/dashboard"
          className="-ml-1 flex items-center gap-2.5 rounded-lg px-1 py-1"
        >
          <Logo size="sm" />
          <span className="text-[15px] font-semibold tracking-tight">
            {appTitle}
          </span>
        </Link>
        <Link
          href="/settings"
          aria-label={`${settingsLabel} – ${user.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 transition active:scale-95"
        >
          {initials(user.name)}
        </Link>
      </div>
    </header>
  );
}

export type TabBarLabels = NavLabels & {
  mainNav: string;
  logTrip: string;
  more: string;
  close: string;
  adminHeading: string;
  importCsv: string;
  exportCsv: string;
  signOut: string;
  adminBadge: string;
};

/**
 * Bottom tab bar + "More" sheet for small screens. Hidden on form routes so
 * the form's sticky save bar owns the bottom of the screen.
 */
export function MobileTabBar({
  labels,
  user,
}: {
  labels: TabBarLabels;
  user: MobileUser;
}) {
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const { main, admin } = buildNav(labels, user.isAdmin);
  const [dashboard, trips, vehicles] = main;
  const moreItems = main.slice(3);
  const moreActive = [...moreItems, ...admin].some((i) => i.match(pathname));

  const openSheet = useCallback(() => {
    const dialog = sheetRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  // Close the sheet whenever the route changes.
  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  if (isFocusRoute(pathname)) return null;

  return (
    <>
      {/* Spacer so page content never hides behind the fixed bar. */}
      <div
        aria-hidden="true"
        className="h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label={labels.mainNav}
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/90 backdrop-blur-xl backdrop-saturate-150 md:hidden"
      >
        <ul className="mx-auto grid h-[var(--tabbar-height)] max-w-lg grid-cols-5 items-stretch px-1">
          <TabLink item={dashboard} pathname={pathname} />
          <TabLink item={trips} pathname={pathname} />
          <li className="flex items-start justify-center">
            <Link
              href="/trips/new"
              className="group -mt-4 flex flex-col items-center gap-1 rounded-2xl px-2 text-[11px] font-medium text-zinc-900"
            >
              <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 ring-4 ring-white transition group-active:scale-95">
                <PlusIcon width={24} height={24} strokeWidth={2.2} />
              </span>
              {labels.logTrip}
            </Link>
          </li>
          <TabLink item={vehicles} pathname={pathname} />
          <li className="flex">
            <button
              type="button"
              onClick={openSheet}
              aria-haspopup="dialog"
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition active:scale-95 ${
                moreActive ? "text-zinc-900" : "text-zinc-500"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                  moreActive ? "bg-zinc-100" : ""
                }`}
              >
                <MenuIcon width={22} height={22} />
              </span>
              {labels.more}
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={sheetRef}
        aria-label={labels.more}
        onClose={() => {
          document.documentElement.style.overflow = "";
        }}
        onClick={(e) => {
          // Tapping the backdrop (outside the panel) closes the sheet.
          if (e.target === e.currentTarget) closeSheet();
        }}
        className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-0 text-zinc-900 shadow-2xl open:animate-sheet-up md:hidden"
      >
        <div className="pb-safe">
          <div className="sticky top-0 bg-white px-5 pt-3 pb-2">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-200"
            />
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200">
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {user.name}
                  {user.isAdmin ? (
                    <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">
                      {labels.adminBadge}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                aria-label={labels.close}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 active:scale-95"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-3 pt-3 pb-4">
            <SheetGroup>
              {moreItems.map((item) => (
                <SheetLink
                  key={item.href}
                  href={item.href}
                  icon={<item.icon />}
                  label={item.label}
                  active={item.match(pathname)}
                  onNavigate={closeSheet}
                />
              ))}
              <SheetLink
                href="/trips/import"
                icon={<UploadIcon />}
                label={labels.importCsv}
                onNavigate={closeSheet}
              />
              <li>
                <a
                  href="/api/trips/export"
                  onClick={closeSheet}
                  className={sheetRowStyles(false)}
                >
                  <SheetRowInner icon={<DownloadIcon />} label={labels.exportCsv} />
                </a>
              </li>
            </SheetGroup>

            {admin.length > 0 ? (
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {labels.adminHeading}
                </p>
                <SheetGroup>
                  {admin.map((item) => (
                    <SheetLink
                      key={item.href}
                      href={item.href}
                      icon={<item.icon />}
                      label={item.label}
                      active={item.match(pathname)}
                      onNavigate={closeSheet}
                    />
                  ))}
                </SheetGroup>
              </div>
            ) : null}

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-sm font-medium text-red-600 transition active:scale-[0.99] active:bg-zinc-200"
              >
                <LogOutIcon width={18} height={18} />
                {labels.signOut}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

function TabLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);
  const Icon = item.icon;
  return (
    <li className="flex">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition active:scale-95 ${
          active ? "text-zinc-900" : "text-zinc-500"
        }`}
      >
        <span
          className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
            active ? "bg-zinc-100" : ""
          }`}
        >
          <Icon width={22} height={22} strokeWidth={active ? 2.1 : 1.8} />
        </span>
        <span className="max-w-full truncate px-0.5">{item.label}</span>
      </Link>
    </li>
  );
}

function SheetGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
      {children}
    </ul>
  );
}

function sheetRowStyles(active: boolean) {
  return `flex min-h-13 items-center gap-3 px-4 text-[15px] font-medium transition active:bg-zinc-100 ${
    active ? "bg-zinc-50 text-zinc-900" : "text-zinc-700"
  }`;
}

function SheetRowInner({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <>
      <span className="text-zinc-500">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRightIcon width={16} height={16} className="text-zinc-300" />
    </>
  );
}

function SheetLink({
  href,
  icon,
  label,
  active = false,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={sheetRowStyles(active)}
      >
        <SheetRowInner icon={icon} label={label} />
      </Link>
    </li>
  );
}
