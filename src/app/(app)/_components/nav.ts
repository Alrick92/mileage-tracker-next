import type { ComponentType, SVGProps } from "react";

import {
  CarIcon,
  GridIcon,
  HomeIcon,
  ListIcon,
  RouteIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/icons";

export type NavLabels = {
  dashboard: string;
  vehicles: string;
  trips: string;
  settings: string;
  admin: string;
  fleet: string;
  audit: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match: (path: string) => boolean;
};

export function buildNav(labels: NavLabels, isAdmin: boolean) {
  const main: NavItem[] = [
    {
      href: "/dashboard",
      label: labels.dashboard,
      icon: HomeIcon,
      match: (p) => p === "/dashboard",
    },
    {
      href: "/trips",
      label: labels.trips,
      icon: RouteIcon,
      match: (p) => p.startsWith("/trips"),
    },
    {
      href: "/vehicles",
      label: labels.vehicles,
      icon: CarIcon,
      match: (p) => p.startsWith("/vehicles"),
    },
    {
      href: "/settings",
      label: labels.settings,
      icon: SettingsIcon,
      match: (p) => p.startsWith("/settings"),
    },
  ];
  const admin: NavItem[] = isAdmin
    ? [
        {
          href: "/admin/fleet",
          label: labels.fleet,
          icon: GridIcon,
          match: (p) => p.startsWith("/admin/fleet"),
        },
        {
          href: "/admin/users",
          label: labels.admin,
          icon: UsersIcon,
          match: (p) => p.startsWith("/admin/users"),
        },
        {
          href: "/admin/audit",
          label: labels.audit,
          icon: ListIcon,
          match: (p) => p.startsWith("/admin/audit"),
        },
      ]
    : [];
  return { main, admin };
}

/**
 * Routes where the user is filling in a form. On mobile we hide the tab bar
 * there so the form's own sticky action bar owns the bottom of the screen.
 */
export function isFocusRoute(path: string): boolean {
  return (
    path === "/trips/new" ||
    path === "/vehicles/new" ||
    /^\/trips\/[^/]+\/edit$/.test(path)
  );
}
