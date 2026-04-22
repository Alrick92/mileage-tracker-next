import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { formatDistance, formatOdometerNumber } from "@/lib/units";
import { Toast } from "@/app/(app)/_components/Toast";

export const metadata = {
  title: "Trip · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ updated?: string }>;

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { id } = await params;
  const { updated } = await searchParams;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: user.id },
    include: {
      vehicle: { select: { id: true, name: true, licensePlate: true } },
    },
  });
  if (!trip) notFound();

  const distanceKm = trip.endOdometer - trip.startOdometer;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {updated ? (
        <Toast variant="success" message={t("toast.tripUpdated")} />
      ) : null}
      <div>
        <Link
          href="/trips"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← {t("trips.title")}
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("trip.detail.title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {t("trip.detail.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/trips/${trip.id}/edit`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {t("common.edit")}
            </Link>
            <Link
              href={`/trips/${trip.id}/delete`}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              {t("common.delete")}
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <dl className="space-y-2 text-sm">
          <Row
            label={t("trips.col.date")}
            value={trip.date.toISOString().slice(0, 10)}
          />
          <Row
            label={t("trips.col.vehicle")}
            value={
              <Link
                href={`/vehicles/${trip.vehicle.id}`}
                className="underline-offset-4 hover:underline"
              >
                {trip.vehicle.name}
                {trip.vehicle.licensePlate
                  ? ` (${trip.vehicle.licensePlate})`
                  : ""}
              </Link>
            }
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
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("trips.col.notes")}
        </h2>
        {trip.notes ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-900">
            {trip.notes}
          </p>
        ) : (
          <p className="mt-3 text-sm italic text-zinc-400">
            {t("trip.detail.notes.empty")}
          </p>
        )}
      </div>

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-mono text-zinc-900">{value}</dd>
    </div>
  );
}
