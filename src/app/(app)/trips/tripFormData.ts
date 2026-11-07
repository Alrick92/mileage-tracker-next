import "server-only";

import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import { localeTag, translator } from "@/lib/i18n";
import { formatOdometer, kmToUnit, unitShort, type Unit } from "@/lib/units";

import type { TripFormLabels, TripFormVehicle } from "./TripForm";

/** Vehicles the user may log trips on, shaped for the trip form. */
export async function loadTripFormVehicles(user: {
  id: string;
  unit: Unit;
  locale: Locale;
}): Promise<TripFormVehicle[]> {
  const [vehicles, lastUsed] = await Promise.all([
    prisma.vehicle.findMany({
      where: { assignments: { some: { userId: user.id } } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        licensePlate: true,
        make: true,
        model: true,
        year: true,
        currentOdometer: true,
        // Pre-fill start odometer with the vehicle's most recent trip end across
        // ALL assigned drivers (not just the current user's own trips) so shared
        // vehicles stay in sync.
        trips: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { endOdometer: true },
        },
      },
    }),
    // When this user last logged each vehicle, for the picker's "Recent" list.
    prisma.trip.groupBy({
      by: ["vehicleId"],
      where: { userId: user.id },
      _max: { date: true, createdAt: true },
    }),
  ]);
  const lastUsedById = new Map(
    lastUsed.map((r) => [
      r.vehicleId,
      Math.max(r._max.date?.getTime() ?? 0, r._max.createdAt?.getTime() ?? 0),
    ]),
  );

  return vehicles.map((v) => {
    const lastEndKm = v.trips[0]?.endOdometer ?? v.currentOdometer;
    return {
      id: v.id,
      name: v.name,
      licensePlate: v.licensePlate,
      description: [v.year, v.make, v.model].filter(Boolean).join(" ") || null,
      lastUsedAt: lastUsedById.get(v.id) ?? null,
      currentOdometerDisplay: formatOdometer(
        v.currentOdometer,
        user.unit,
        user.locale,
      ),
      defaultStartOdometer: Math.round(kmToUnit(lastEndKm, user.unit)),
    };
  });
}

export function tripFormLabels(
  user: { unit: Unit; locale: Locale },
  saveLabelKey: "trips.form.save" | "trips.edit.save",
): TripFormLabels {
  const t = translator(user.locale);
  const unit = unitShort(user.unit, user.locale);
  return {
    vehiclePicker: {
      vehicle: t("trips.form.vehicle"),
      select: t("trips.form.vehicle.select"),
      sheetTitle: t("trips.form.vehicle.sheetTitle"),
      change: t("trips.form.vehicle.change"),
      search: t("trips.form.vehicle.search"),
      recent: t("trips.form.vehicle.recent"),
      all: t("trips.form.vehicle.all"),
      noResults: t("trips.form.vehicle.noResults"),
      close: t("common.close"),
      required: t("trips.form.vehicle.required"),
      last: t("trips.form.vehicle.optionLast"),
    },
    date: t("trips.form.date"),
    today: t("trips.form.today"),
    yesterday: t("trips.form.yesterday"),
    driver: t("trips.form.driver"),
    startOdometer: t("trips.form.startOdometer", { unit }),
    endOdometer: t("trips.form.endOdometer", { unit }),
    startPrefillHelp: t("trips.form.startPrefillHelp"),
    distance: t("trips.form.distance"),
    distanceField: t("trips.form.distanceField", { unit }),
    distanceHelp: t("trips.form.distanceHelp"),
    distanceUnit: unit,
    numberLocale: localeTag(user.locale),
    endBeforeStart: t("trips.form.endBeforeStart"),
    notes: t("trips.form.notes"),
    notesPlaceholder: t("trips.form.notesPlaceholder"),
    save: t(saveLabelKey),
    saving: t("common.saving"),
    cancel: t("common.cancel"),
  };
}
