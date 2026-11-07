import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { PageHeader, cardStyles } from "@/components/ui";

import { TripForm } from "../TripForm";
import { loadTripFormVehicles, tripFormLabels } from "../tripFormData";

export const metadata = {
  title: "Log trip · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ vehicleId?: string }>;

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { vehicleId } = await searchParams;

  const [vehicles, lastTrip] = await Promise.all([
    loadTripFormVehicles(user),
    // Without an explicit ?vehicleId, default to the vehicle the user logged
    // most recently: it's usually the one they're driving.
    vehicleId
      ? null
      : prisma.trip.findFirst({
          where: { userId: user.id },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: { vehicleId: true },
        }),
  ]);
  if (vehicles.length === 0) {
    redirect("/vehicles/new");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 md:mx-0">
      <PageHeader
        back={{ href: "/trips", label: t("trips.title") }}
        title={t("trips.new.title")}
        subtitle={t("trips.new.subtitle")}
      />
      <div className={`${cardStyles} p-4 sm:p-6`}>
        <TripForm
          vehicles={vehicles}
          defaultVehicleId={vehicleId ?? lastTrip?.vehicleId}
          defaultDriverName={user.name}
          labels={tripFormLabels(user, "trips.form.save")}
        />
      </div>
    </div>
  );
}
