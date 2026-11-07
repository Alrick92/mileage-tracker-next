import Link from "next/link";

import { ChevronRightIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { cardStyles } from "@/components/ui";
import { localeTag, translator, type Locale } from "@/lib/i18n";
import {
  formatDistance,
  formatOdometerNumber,
  unitShort,
  type Unit,
} from "@/lib/units";

export type TripListItem = {
  id: string;
  date: Date;
  driverName: string;
  startOdometer: number;
  endOdometer: number;
  notes: string | null;
  vehicle?: { name: string; licensePlate: string | null };
};

/**
 * Trips as tappable cards on small screens and a dense table from `md` up.
 * Trip dates are stored as UTC midnight, so they're formatted in UTC.
 */
export function TripList({
  trips,
  unit,
  locale,
  showVehicle = true,
  footer,
}: {
  trips: TripListItem[];
  unit: Unit;
  locale: Locale;
  showVehicle?: boolean;
  footer?: React.ReactNode;
}) {
  const t = translator(locale);
  const tag = localeTag(locale);
  const weekday = new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" });
  const day = new Intl.DateTimeFormat(tag, { day: "numeric", timeZone: "UTC" });
  const month = new Intl.DateTimeFormat(tag, { month: "short", timeZone: "UTC" });
  const fullDate = new Intl.DateTimeFormat(tag, {
    dateStyle: "full",
    timeZone: "UTC",
  });

  return (
    <div className={`${cardStyles} overflow-hidden`}>
      {/* Mobile: cards */}
      <ul className="divide-y divide-zinc-100 md:hidden">
        {trips.map((trip) => {
          const distanceKm = trip.endOdometer - trip.startOdometer;
          const title = showVehicle && trip.vehicle ? trip.vehicle.name : trip.driverName;
          const meta = [
            showVehicle && trip.vehicle ? trip.driverName : null,
            trip.notes,
          ].filter(Boolean);
          return (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-zinc-50"
              >
                <time
                  dateTime={trip.date.toISOString().slice(0, 10)}
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-zinc-100 leading-none"
                >
                  <span className="sr-only">{fullDate.format(trip.date)}</span>
                  <span
                    aria-hidden="true"
                    className="text-[10px] font-medium uppercase text-zinc-500"
                  >
                    {month.format(trip.date).replace(".", "")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-lg font-semibold text-zinc-900"
                  >
                    {day.format(trip.date)}
                  </span>
                </time>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    <span aria-hidden="true" className="capitalize">
                      {weekday.format(trip.date)}
                    </span>
                    {meta.length ? ` · ${meta.join(" · ")}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold text-zinc-900">
                    {formatDistance(distanceKm, unit, locale)}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                    {formatOdometerNumber(trip.endOdometer, unit, locale)}
                  </p>
                </div>
                <ChevronRightIcon
                  width={16}
                  height={16}
                  className="-mr-1 shrink-0 text-zinc-300"
                />
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
                {t("trips.col.date")}
              </th>
              {showVehicle ? (
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("trips.col.vehicle")}
                </th>
              ) : null}
              <th scope="col" className="px-4 py-3 font-medium">
                {t("trips.col.driver")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("trips.col.start")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("trips.col.end")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("trips.col.distance")} ({unitShort(unit, locale)})
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("trips.col.notes")}
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">{t("trips.col.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {trips.map((trip) => (
              <tr key={trip.id} className="group transition hover:bg-zinc-50/80">
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-zinc-700">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {trip.date.toISOString().slice(0, 10)}
                  </Link>
                </td>
                {showVehicle && trip.vehicle ? (
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {trip.vehicle.name}
                    </div>
                    {trip.vehicle.licensePlate ? (
                      <div className="font-mono text-xs text-zinc-500">
                        {trip.vehicle.licensePlate}
                      </div>
                    ) : null}
                  </td>
                ) : null}
                <td className="px-4 py-3 text-zinc-700">{trip.driverName}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-600">
                  {formatOdometerNumber(trip.startOdometer, unit, locale)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-600">
                  {formatOdometerNumber(trip.endOdometer, unit, locale)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-900">
                  {formatOdometerNumber(
                    trip.endOdometer - trip.startOdometer,
                    unit,
                    locale,
                  )}
                </td>
                <td className="max-w-[220px] px-4 py-3 text-zinc-600">
                  {trip.notes ? (
                    <span className="block truncate" title={trip.notes}>
                      {trip.notes}
                    </span>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100 focus-within:opacity-100">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      {t("common.view")}
                    </Link>
                    <Link
                      href={`/trips/${trip.id}/edit`}
                      aria-label={`${t("common.edit")} – ${trip.date.toISOString().slice(0, 10)}`}
                      title={t("common.edit")}
                      className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <PencilIcon width={16} height={16} />
                    </Link>
                    <Link
                      href={`/trips/${trip.id}/delete`}
                      aria-label={`${t("common.delete")} – ${trip.date.toISOString().slice(0, 10)}`}
                      title={t("common.delete")}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon width={16} height={16} />
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
