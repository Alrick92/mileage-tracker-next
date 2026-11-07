import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { formatDistance, formatOdometerNumber } from "@/lib/units";
import { TrashIcon } from "@/components/icons";
import { BackLink, buttonStyles } from "@/components/ui";

import { deleteTripAction } from "../../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function DeleteTripPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: user.id },
    include: { vehicle: { select: { name: true, licensePlate: true } } },
  });
  if (!trip) notFound();

  const distanceKm = trip.endOdometer - trip.startOdometer;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackLink href={`/trips/${trip.id}`} label={t("trip.detail.title")} />
      <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-xs sm:p-6">
        <h1 className="text-xl font-semibold text-zinc-900">
          {t("trip.delete.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t("trip.delete.subtitle")}
        </p>

        <dl className="mt-4 space-y-2.5 rounded-xl bg-zinc-50 p-4 text-sm">
          <Row
            label={t("trips.col.date")}
            value={trip.date.toISOString().slice(0, 10)}
          />
          <Row
            label={t("trips.col.vehicle")}
            value={`${trip.vehicle.name}${
              trip.vehicle.licensePlate ? ` (${trip.vehicle.licensePlate})` : ""
            }`}
          />
          <Row label={t("trips.col.driver")} value={trip.driverName} />
          <Row
            label={t("trips.col.start")}
            value={formatOdometerNumber(
              trip.startOdometer,
              user.unit,
              user.locale,
            )}
          />
          <Row
            label={t("trips.col.end")}
            value={formatOdometerNumber(
              trip.endOdometer,
              user.unit,
              user.locale,
            )}
          />
          <Row
            label={t("trips.col.distance")}
            value={formatDistance(distanceKm, user.unit, user.locale)}
          />
        </dl>

        <form
          action={deleteTripAction}
          className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <Link href={`/trips/${trip.id}`} className={buttonStyles.ghost}>
            {t("common.cancel")}
          </Link>
          <button type="submit" className={`${buttonStyles.danger} sm:order-first`}>
            <TrashIcon width={16} height={16} />
            {t("common.delete")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-900">{value}</dd>
    </div>
  );
}
