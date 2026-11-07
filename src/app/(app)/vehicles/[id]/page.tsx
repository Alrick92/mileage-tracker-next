import Link from "next/link";
import { notFound } from "next/navigation";

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
import { DownloadIcon, PlusIcon, RouteIcon, TrashIcon } from "@/components/icons";
import {
  EmptyState,
  PageHeader,
  SectionHeading,
  StatCard,
  buttonStyles,
  cardStyles,
} from "@/components/ui";
import { Pagination, paginationLabels } from "@/app/(app)/_components/Pagination";
import { TripList } from "@/app/(app)/_components/TripList";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { id } = await params;
  const { page: pageRaw } = await searchParams;

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      assignments: { some: { userId: user.id } },
    },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!vehicle) notFound();

  // Each user sees only their own trips on a shared vehicle ("keeps their side
  // of the record"). The vehicle's currentOdometer remains shared across drivers.
  const tripWhere = { vehicleId: vehicle.id, userId: user.id } as const;

  const [tripCount, distanceAgg] = await Promise.all([
    prisma.trip.count({ where: tripWhere }),
    prisma.$queryRaw<{ sum: bigint | null }[]>`
      SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
      FROM "Trip"
      WHERE "vehicleId" = ${vehicle.id} AND "userId" = ${user.id}
    `,
  ]);
  const totalPages = computeTotalPages(tripCount);
  const page = parsePage(pageRaw, totalPages);

  const trips = await prisma.trip.findMany({
    where: tripWhere,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  const totalDistanceKm = Number(distanceAgg[0]?.sum ?? 0);
  const { unit, locale } = user;
  const tag = localeTag(locale);
  const logHref = `/trips/new?vehicleId=${vehicle.id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/vehicles", label: t("vehicles.title") }}
        title={vehicle.name}
        subtitle={
          <>
            {[vehicle.year, vehicle.make, vehicle.model]
              .filter(Boolean)
              .join(" ") || "—"}
            {vehicle.licensePlate ? (
              <span className="ml-2 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-xs text-zinc-700">
                {vehicle.licensePlate}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Link
              href={logHref}
              className={`${buttonStyles.primary} flex-1 sm:flex-none`}
            >
              <PlusIcon width={16} height={16} />
              {t("trips.logTrip")}
            </Link>
            <a
              href={`/api/trips/export?vehicleId=${vehicle.id}`}
              className={buttonStyles.secondary}
              aria-label={t("trips.exportCsv")}
            >
              <DownloadIcon width={16} height={16} />
              <span className="hidden sm:inline">{t("trips.exportCsv")}</span>
            </a>
            <Link
              href={`/vehicles/${vehicle.id}/delete`}
              className={buttonStyles.dangerOutline}
              aria-label={t("common.delete")}
            >
              <TrashIcon width={16} height={16} />
              <span className="hidden sm:inline">{t("common.delete")}</span>
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        <StatCard
          label={t("dashboard.col.currentOdometer")}
          value={formatOdometer(vehicle.currentOdometer, unit, locale)}
          className="col-span-2 sm:col-span-1"
        />
        <StatCard
          label={t("dashboard.col.trips")}
          value={tripCount.toLocaleString(tag)}
        />
        <StatCard
          label={t("dashboard.stat.distance")}
          value={formatDistance(totalDistanceKm, unit, locale)}
        />
      </section>

      <section className={`${cardStyles} p-4`}>
        <SectionHeading
          aside={
            user.role === "ADMIN" ? (
              <Link
                href={`/admin/vehicles/${vehicle.id}/assignments`}
                className="inline-flex min-h-8 items-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {t("vehicle.drivers.manage")}
              </Link>
            ) : null
          }
        >
          {t("vehicle.drivers.heading")}
        </SectionHeading>
        <ul className="flex flex-wrap gap-2">
          {vehicle.assignments.map((a) => (
            <li
              key={a.id}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pr-3 pl-1 text-xs text-zinc-700"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                {a.user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="font-medium text-zinc-900">{a.user.name}</span>
              <span className="hidden truncate font-mono text-zinc-500 sm:inline">
                {a.user.email}
              </span>
              {a.user.id === user.id ? (
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                  {t("admin.youLabel")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {vehicle.assignments.length <= 1 && user.role !== "ADMIN" ? (
          <p className="mt-3 text-xs text-zinc-500">
            {t("vehicle.drivers.soleHint")}
          </p>
        ) : null}
      </section>

      <section>
        <SectionHeading>{t("trips.title")}</SectionHeading>
        {tripCount === 0 ? (
          <EmptyState
            icon={<RouteIcon width={24} height={24} />}
            title={t("trips.empty.title")}
            subtitle={t("trips.empty.subtitle")}
            action={
              <Link href={logHref} className={buttonStyles.primary}>
                <PlusIcon width={16} height={16} />
                {t("trips.empty.cta")}
              </Link>
            }
          />
        ) : (
          <TripList
            trips={trips}
            unit={unit}
            locale={locale}
            showVehicle={false}
            footer={
              <Pagination
                page={page}
                totalPages={totalPages}
                total={tripCount}
                basePath={`/vehicles/${vehicle.id}`}
                labels={paginationLabels(locale, page, totalPages, tripCount)}
              />
            }
          />
        )}
      </section>
    </div>
  );
}
