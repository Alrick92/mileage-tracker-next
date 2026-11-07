import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import { formatDistance, formatOdometer } from "@/lib/units";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { CarIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import {
  EmptyState,
  PageHeader,
  SectionHeading,
  StatCard,
  buttonStyles,
} from "@/components/ui";
import { Pagination, paginationLabels } from "@/app/(app)/_components/Pagination";
import { TripList } from "@/app/(app)/_components/TripList";
import { VehicleList } from "@/app/(app)/_components/VehicleList";

export const metadata = {
  title: "Dashboard · Mileage Tracker",
};

export const dynamic = "force-dynamic";

const RECENT_TRIPS = 5;

type SearchParams = Promise<{ page?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { unit, locale } = user;
  const { page: pageRaw } = await searchParams;

  const assignmentFilter = {
    assignments: { some: { userId: user.id } },
  } as const;

  const [vehicleCount, tripCount, totalDistance, fleetOdometerRow, recentTrips] =
    await Promise.all([
      prisma.vehicle.count({ where: assignmentFilter }),
      prisma.trip.count({ where: { userId: user.id } }),
      prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
        FROM "Trip"
        WHERE "userId" = ${user.id}
      `,
      prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM(v."currentOdometer"), 0)::bigint AS sum
        FROM "Vehicle" v
        WHERE EXISTS (
          SELECT 1 FROM "VehicleAssignment" va
          WHERE va."vehicleId" = v."id" AND va."userId" = ${user.id}
        )
      `,
      prisma.trip.findMany({
        where: { userId: user.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { vehicle: { select: { name: true, licensePlate: true } } },
        take: RECENT_TRIPS,
      }),
    ]);

  const totalPages = computeTotalPages(vehicleCount);
  const page = parsePage(pageRaw, totalPages);

  const vehicles = await prisma.vehicle.findMany({
    where: assignmentFilter,
    orderBy: { updatedAt: "desc" },
    include: {
      // Per-user trip count: each driver sees their own tally on shared vehicles.
      _count: { select: { trips: { where: { userId: user.id } } } },
    },
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  const distanceTotalKm = Number(totalDistance[0]?.sum ?? 0);
  const fleetOdometerKm = Number(fleetOdometerRow[0]?.sum ?? 0);
  const tag = localeTag(locale);
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <>
            <span className="md:hidden">
              {t("dashboard.greeting", { name: firstName })}
            </span>
            <span className="hidden md:inline">{t("dashboard.title")}</span>
          </>
        }
        subtitle={t("dashboard.subtitle")}
        actions={
          <Link
            href="/vehicles/new"
            className={`${buttonStyles.secondary} max-md:hidden`}
          >
            <CarIcon width={16} height={16} />
            {t("dashboard.addVehicle")}
          </Link>
        }
      />

      {vehicleCount > 0 ? (
        <Link
          href="/trips/new"
          className="group flex items-center gap-4 rounded-2xl bg-zinc-900 p-4 text-white shadow-lg shadow-zinc-900/15 transition active:scale-[0.99] md:hidden"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <PlusIcon width={24} height={24} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">
              {t("trips.logTrip")}
            </span>
            <span className="block truncate text-sm text-zinc-400">
              {t("dashboard.quickLogHint")}
            </span>
          </span>
          <ChevronRightIcon className="text-zinc-500 transition group-active:translate-x-0.5" />
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        <StatCard
          label={t("dashboard.stat.vehicles")}
          value={vehicleCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("dashboard.stat.trips")}
          value={tripCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("dashboard.stat.distance")}
          value={formatDistance(distanceTotalKm, unit, locale)}
          className="col-span-2 sm:col-span-1"
        />
      </section>

      <section>
        <SectionHeading
          aside={
            vehicleCount > 0 ? (
              <p className="truncate text-xs text-zinc-500">
                <span className="hidden sm:inline">
                  {t("dashboard.fleetOdometerTotal")}{" "}
                </span>
                <span className="font-mono text-zinc-900">
                  {formatOdometer(fleetOdometerKm, unit, locale)}
                </span>
              </p>
            ) : null
          }
        >
          {t("dashboard.vehiclesHeading")}
        </SectionHeading>

        {vehicleCount === 0 ? (
          <EmptyState
            icon={<CarIcon width={24} height={24} />}
            title={t("dashboard.empty.title")}
            subtitle={t("dashboard.empty.subtitle")}
            action={
              <Link href="/vehicles/new" className={buttonStyles.primary}>
                <PlusIcon width={16} height={16} />
                {t("dashboard.addVehicle")}
              </Link>
            }
          />
        ) : (
          <VehicleList
            vehicles={vehicles.map((v) => ({ ...v, tripCount: v._count.trips }))}
            unit={unit}
            locale={locale}
            footer={
              <Pagination
                page={page}
                totalPages={totalPages}
                total={vehicleCount}
                basePath="/dashboard"
                labels={paginationLabels(locale, page, totalPages, vehicleCount)}
              />
            }
          />
        )}
      </section>

      {recentTrips.length > 0 ? (
        <section>
          <SectionHeading
            aside={
              <Link
                href="/trips"
                className="inline-flex min-h-8 items-center gap-0.5 rounded-lg px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                {t("dashboard.viewAllTrips")}
                <ChevronRightIcon width={14} height={14} />
              </Link>
            }
          >
            {t("dashboard.recentTrips")}
          </SectionHeading>
          <TripList trips={recentTrips} unit={unit} locale={locale} />
        </section>
      ) : null}
    </div>
  );
}
