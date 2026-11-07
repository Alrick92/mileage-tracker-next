import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { kmToUnit } from "@/lib/units";
import { PageHeader, cardStyles } from "@/components/ui";

import { TripForm } from "../../TripForm";
import { loadTripFormVehicles, tripFormLabels } from "../../tripFormData";

export const metadata = {
  title: "Edit trip · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditTripPage({ params }: { params: Params }) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { id } = await params;

  const [trip, vehicles] = await Promise.all([
    prisma.trip.findFirst({ where: { id, userId: user.id } }),
    loadTripFormVehicles(user),
  ]);
  if (!trip) notFound();

  const cancelHref = `/trips/${trip.id}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5 md:mx-0">
      <PageHeader
        back={{ href: cancelHref, label: t("trip.detail.title") }}
        title={t("trips.edit.title")}
        subtitle={t("trips.edit.subtitle")}
      />
      <div className={`${cardStyles} p-4 sm:p-6`}>
        <TripForm
          vehicles={vehicles}
          mode="edit"
          cancelHref={cancelHref}
          initialValues={{
            tripId: trip.id,
            vehicleId: trip.vehicleId,
            driverName: trip.driverName,
            date: trip.date.toISOString().slice(0, 10),
            startOdometer: Math.round(kmToUnit(trip.startOdometer, user.unit)),
            endOdometer: Math.round(kmToUnit(trip.endOdometer, user.unit)),
            notes: trip.notes ?? "",
          }}
          labels={tripFormLabels(user, "trips.edit.save")}
        />
      </div>
    </div>
  );
}
