import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { formatOdometer, kmToUnit, unitShort } from "@/lib/units";

import { TripForm, type TripFormVehicle } from "../../TripForm";

export const metadata = {
  title: "Edit trip · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditTripPage({ params }: { params: Params }) {
  const user = await requireUser();
  const t = translator(user.locale);
  const unit = unitShort(user.unit, user.locale);
  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: user.id },
  });
  if (!trip) notFound();

  const vehiclesRaw = await prisma.vehicle.findMany({
    where: { assignments: { some: { userId: user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      licensePlate: true,
      currentOdometer: true,
      trips: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { endOdometer: true },
      },
    },
  });

  const vehicles: TripFormVehicle[] = vehiclesRaw.map((v) => {
    const lastEndKm = v.trips[0]?.endOdometer ?? v.currentOdometer;
    return {
      id: v.id,
      name: v.name,
      licensePlate: v.licensePlate,
      currentOdometerDisplay: formatOdometer(
        v.currentOdometer,
        user.unit,
        user.locale,
      ),
      defaultStartOdometer: Math.round(kmToUnit(lastEndKm, user.unit)),
    };
  });

  const cancelHref = `/trips/${trip.id}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={cancelHref}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← {t("trip.detail.title")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("trips.edit.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("trips.edit.subtitle")}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <TripForm
          vehicles={vehicles}
          mode="edit"
          cancelHref={cancelHref}
          initialValues={{
            tripId: trip.id,
            vehicleId: trip.vehicleId,
            driverName: trip.driverName,
            date: trip.date.toISOString().slice(0, 10),
            startOdometer: Math.round(
              kmToUnit(trip.startOdometer, user.unit),
            ),
            endOdometer: Math.round(kmToUnit(trip.endOdometer, user.unit)),
            notes: trip.notes ?? "",
          }}
          labels={{
            vehicle: t("trips.form.vehicle"),
            vehicleSelect: t("trips.form.vehicle.select"),
            vehicleOptionLast: t("trips.form.vehicle.optionLast"),
            date: t("trips.form.date"),
            driver: t("trips.form.driver"),
            startOdometer: t("trips.form.startOdometer", { unit }),
            endOdometer: t("trips.form.endOdometer", { unit }),
            startPrefillHelp: t("trips.form.startPrefillHelp"),
            distance: t("trips.form.distance"),
            distanceUnit: unit,
            notes: t("trips.form.notes"),
            save: t("trips.edit.save"),
            saving: t("common.saving"),
            cancel: t("common.cancel"),
          }}
        />
      </div>
    </div>
  );
}
