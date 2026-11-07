import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localeTag, translator } from "@/lib/i18n";
import { formatDistance } from "@/lib/units";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import {
  DownloadIcon,
  PlusIcon,
  RouteIcon,
  UploadIcon,
} from "@/components/icons";
import { EmptyState, PageHeader, StatCard, buttonStyles } from "@/components/ui";
import { Pagination, paginationLabels } from "@/app/(app)/_components/Pagination";
import { Toast } from "@/app/(app)/_components/Toast";
import { TripList } from "@/app/(app)/_components/TripList";

export const metadata = {
  title: "Trips · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  saved?: string;
  updated?: string;
  deleted?: string;
  error?: string;
  page?: string;
}>;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { unit, locale } = user;
  const params = await searchParams;

  const [total, distanceAgg] = await Promise.all([
    prisma.trip.count({ where: { userId: user.id } }),
    prisma.$queryRaw<{ sum: bigint | null }[]>`
      SELECT COALESCE(SUM("endOdometer" - "startOdometer"), 0)::bigint AS sum
      FROM "Trip"
      WHERE "userId" = ${user.id}
    `,
  ]);
  const totalPages = computeTotalPages(total);
  const page = parsePage(params.page, totalPages);
  const totalDistanceKm = Number(distanceAgg[0]?.sum ?? 0);

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      vehicle: { select: { name: true, licensePlate: true } },
    },
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  const tag = localeTag(locale);

  return (
    <div className="space-y-6">
      {params.saved ? (
        <Toast variant="success" message={t("toast.tripSaved")} />
      ) : null}
      {params.updated ? (
        <Toast variant="success" message={t("toast.tripUpdated")} />
      ) : null}
      {params.deleted ? (
        <Toast variant="success" message={t("toast.tripDeleted")} />
      ) : null}
      {params.error ? <Toast variant="error" message={params.error} /> : null}

      <PageHeader
        title={t("trips.title")}
        subtitle={t("trips.subtitle")}
        actions={
          <>
            <a href="/api/trips/export" className={buttonStyles.secondary}>
              <DownloadIcon width={16} height={16} />
              {t("trips.exportCsv")}
            </a>
            <Link href="/trips/import" className={buttonStyles.secondary}>
              <UploadIcon width={16} height={16} />
              {t("trips.importCsv")}
            </Link>
            {/* On mobile the tab bar's centre button logs a trip. */}
            <Link
              href="/trips/new"
              className={`${buttonStyles.primary} max-md:hidden`}
            >
              <PlusIcon width={16} height={16} />
              {t("trips.logTrip")}
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:gap-4">
        <StatCard
          label={t("trips.summary.shown")}
          value={total.toLocaleString(tag)}
        />
        <StatCard
          label={t("trips.summary.distance")}
          value={formatDistance(totalDistanceKm, unit, locale)}
        />
      </section>

      {total === 0 ? (
        <EmptyState
          icon={<RouteIcon width={24} height={24} />}
          title={t("trips.empty.title")}
          subtitle={t("trips.empty.subtitle")}
          action={
            <Link href="/trips/new" className={buttonStyles.primary}>
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
          footer={
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              basePath="/trips"
              labels={paginationLabels(locale, page, totalPages, total)}
            />
          }
        />
      )}
    </div>
  );
}
