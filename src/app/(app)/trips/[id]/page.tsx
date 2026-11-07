import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import { formatDistance, formatOdometerNumber, unitShort } from "@/lib/units";
import { ChevronRightIcon, PencilIcon, TrashIcon } from "@/components/icons";
import {
  PageHeader,
  SectionHeading,
  buttonStyles,
  cardStyles,
} from "@/components/ui";
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

  const { unit, locale } = user;
  const distanceKm = trip.endOdometer - trip.startOdometer;
  const longDate = new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(trip.date);

  return (
    <div className="mx-auto max-w-2xl space-y-5 md:mx-0">
      {updated ? (
        <Toast variant="success" message={t("toast.tripUpdated")} />
      ) : null}

      <PageHeader
        back={{ href: "/trips", label: t("trips.title") }}
        title={t("trip.detail.title")}
        subtitle={<span className="capitalize">{longDate}</span>}
        actions={
          <>
            <Link
              href={`/trips/${trip.id}/edit`}
              className={`${buttonStyles.secondary} flex-1 sm:flex-none`}
            >
              <PencilIcon width={16} height={16} />
              {t("common.edit")}
            </Link>
            <Link
              href={`/trips/${trip.id}/delete`}
              className={`${buttonStyles.dangerOutline} flex-1 sm:flex-none`}
            >
              <TrashIcon width={16} height={16} />
              {t("common.delete")}
            </Link>
          </>
        }
      />

      <div className={`${cardStyles} overflow-hidden`}>
        <div className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-6 text-center sm:px-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {t("trips.col.distance")}
          </p>
          <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-zinc-900">
            {formatDistance(distanceKm, unit, locale)}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-sm text-zinc-500">
            {formatOdometerNumber(trip.startOdometer, unit, locale)}
            <ChevronRightIcon width={14} height={14} className="text-zinc-300" />
            {formatOdometerNumber(trip.endOdometer, unit, locale)}
            <span className="text-zinc-400">{unitShort(unit, locale)}</span>
          </p>
        </div>
        <dl className="divide-y divide-zinc-100 text-sm">
          <Row
            label={t("trips.col.vehicle")}
            value={
              <Link
                href={`/vehicles/${trip.vehicle.id}`}
                className="font-medium text-zinc-900 underline-offset-4 hover:underline"
              >
                {trip.vehicle.name}
                {trip.vehicle.licensePlate ? (
                  <span className="ml-1.5 font-mono text-xs text-zinc-500">
                    {trip.vehicle.licensePlate}
                  </span>
                ) : null}
              </Link>
            }
          />
          <Row label={t("trips.col.driver")} value={trip.driverName} />
          <Row
            label={t("trips.col.date")}
            value={
              <span className="font-mono">
                {trip.date.toISOString().slice(0, 10)}
              </span>
            }
          />
        </dl>
      </div>

      <section className={`${cardStyles} p-5 sm:p-6`}>
        <SectionHeading>{t("trips.col.notes")}</SectionHeading>
        {trip.notes ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-900">
            {trip.notes}
          </p>
        ) : (
          <p className="text-sm text-zinc-400 italic">
            {t("trip.detail.notes.empty")}
          </p>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-zinc-900">{value}</dd>
    </div>
  );
}
