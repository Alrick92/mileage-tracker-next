import Link from "next/link";

import { CarIcon, PlusIcon } from "@/components/icons";
import { cardStyles } from "@/components/ui";
import { translator, type Locale } from "@/lib/i18n";
import { formatOdometer, type Unit } from "@/lib/units";

export type VehicleListItem = {
  id: string;
  name: string;
  licensePlate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  currentOdometer: number;
  tripCount: number;
  driverCount?: number;
};

/**
 * Vehicles as cards with a one-tap "Log trip" shortcut on small screens and a
 * table from `md` up.
 */
export function VehicleList({
  vehicles,
  unit,
  locale,
  footer,
}: {
  vehicles: VehicleListItem[];
  unit: Unit;
  locale: Locale;
  footer?: React.ReactNode;
}) {
  const t = translator(locale);

  return (
    <div className={`${cardStyles} overflow-hidden`}>
      {/* Mobile: cards */}
      <ul className="divide-y divide-zinc-100 md:hidden">
        {vehicles.map((v) => {
          const subtitle = [
            v.licensePlate,
            [v.year, v.make, v.model].filter(Boolean).join(" ") || null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={v.id} className="flex items-center gap-2 pr-3">
              <Link
                href={`/vehicles/${v.id}`}
                className="flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pl-4 transition active:bg-zinc-50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                  <CarIcon width={22} height={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-900">
                      {v.name}
                    </span>
                    {v.driverCount && v.driverCount > 1 ? (
                      <SharedBadge label={t("vehicles.sharedBadge")} />
                    ) : null}
                  </span>
                  {subtitle ? (
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {subtitle}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block font-mono text-xs text-zinc-700">
                    {formatOdometer(v.currentOdometer, unit, locale)}
                    <span className="text-zinc-400">
                      {" · "}
                      {t("vehicles.tripCount", { count: v.tripCount })}
                    </span>
                  </span>
                </span>
              </Link>
              <Link
                href={`/trips/new?vehicleId=${v.id}`}
                aria-label={`${t("trips.logTrip")} – ${v.name}`}
                className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-sm transition active:scale-95"
              >
                <PlusIcon width={14} height={14} strokeWidth={2.4} />
                {t("nav.logShort")}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/70 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("dashboard.col.vehicle")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("dashboard.col.plate")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("dashboard.col.trips")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("dashboard.col.currentOdometer")}
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">{t("trips.col.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="group transition hover:bg-zinc-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/vehicles/${v.id}`}
                    className="font-medium text-zinc-900 underline-offset-4 hover:underline"
                  >
                    {v.name}
                  </Link>
                  {v.driverCount && v.driverCount > 1 ? (
                    <span className="ml-2">
                      <SharedBadge label={t("vehicles.sharedBadge")} />
                    </span>
                  ) : null}
                  {v.make || v.model ? (
                    <div className="text-xs text-zinc-500">
                      {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                  {v.licensePlate ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700">{v.tripCount}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-900">
                  {formatOdometer(v.currentOdometer, unit, locale)}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/trips/new?vehicleId=${v.id}`}
                      aria-label={`${t("trips.logTrip")} – ${v.name}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 opacity-70 transition group-hover:opacity-100 hover:bg-zinc-100 focus-visible:opacity-100"
                    >
                      <PlusIcon width={14} height={14} />
                      {t("trips.logTrip")}
                    </Link>
                    <Link
                      href={`/vehicles/${v.id}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
                    >
                      {t("common.view")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

function SharedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-600">
      {label}
    </span>
  );
}
