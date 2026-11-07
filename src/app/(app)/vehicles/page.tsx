import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import {
  DEFAULT_PAGE_SIZE,
  computeSkip,
  computeTotalPages,
  parsePage,
} from "@/lib/pagination";
import { CarIcon, PlusIcon } from "@/components/icons";
import { EmptyState, PageHeader, buttonStyles } from "@/components/ui";
import { Pagination, paginationLabels } from "@/app/(app)/_components/Pagination";
import { Toast } from "@/app/(app)/_components/Toast";
import { VehicleList } from "@/app/(app)/_components/VehicleList";

export const metadata = {
  title: "Vehicles · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  saved?: string;
  deleted?: string;
  error?: string;
  page?: string;
}>;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const params = await searchParams;

  const assignmentFilter = {
    assignments: { some: { userId: user.id } },
  } as const;

  const total = await prisma.vehicle.count({ where: assignmentFilter });
  const totalPages = computeTotalPages(total);
  const page = parsePage(params.page, totalPages);

  const vehicles = await prisma.vehicle.findMany({
    where: assignmentFilter,
    orderBy: { name: "asc" },
    include: {
      // Per-user trip count: each driver sees their own tally on shared vehicles.
      _count: {
        select: {
          trips: { where: { userId: user.id } },
          assignments: true,
        },
      },
    },
    skip: computeSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      {params.saved ? (
        <Toast variant="success" message={t("toast.vehicleSaved")} />
      ) : null}
      {params.deleted ? (
        <Toast variant="success" message={t("toast.vehicleDeleted")} />
      ) : null}
      {params.error ? <Toast variant="error" message={params.error} /> : null}

      <PageHeader
        title={t("vehicles.title")}
        subtitle={t("vehicles.subtitle")}
        actions={
          <Link href="/vehicles/new" className={buttonStyles.primary}>
            <PlusIcon width={16} height={16} />
            {t("dashboard.addVehicle")}
          </Link>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={<CarIcon width={24} height={24} />}
          title={t("vehicles.empty.title")}
          subtitle={t("vehicles.empty.subtitle")}
        />
      ) : (
        <VehicleList
          vehicles={vehicles.map((v) => ({
            ...v,
            tripCount: v._count.trips,
            driverCount: v._count.assignments,
          }))}
          unit={user.unit}
          locale={user.locale}
          footer={
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              basePath="/vehicles"
              labels={paginationLabels(user.locale, page, totalPages, total)}
            />
          }
        />
      )}
    </div>
  );
}
