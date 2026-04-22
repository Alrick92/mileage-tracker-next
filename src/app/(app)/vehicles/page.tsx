import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { formatOdometer } from "@/lib/units";
import { Toast } from "@/app/(app)/_components/Toast";

export const metadata = {
  title: "Vehicles · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ saved?: string; deleted?: string; error?: string }>;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const params = await searchParams;

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { trips: true } } },
  });

  return (
    <div className="space-y-6">
      {params.saved ? (
        <Toast variant="success" message={t("toast.vehicleSaved")} />
      ) : null}
      {params.deleted ? (
        <Toast variant="success" message={t("toast.vehicleDeleted")} />
      ) : null}
      {params.error ? (
        <Toast variant="error" message={decodeURIComponent(params.error)} />
      ) : null}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("vehicles.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("vehicles.subtitle")}
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {t("dashboard.addVehicle")}
        </Link>
      </header>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">
            {t("vehicles.empty.title")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t("vehicles.empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  {t("dashboard.col.vehicle")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("dashboard.col.plate")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("dashboard.col.trips")}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("dashboard.col.currentOdometer")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{v.name}</div>
                    {v.make || v.model ? (
                      <div className="text-xs text-zinc-500">
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                    {v.licensePlate ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{v._count.trips}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-900">
                    {formatOdometer(v.currentOdometer, user.unit, user.locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vehicles/${v.id}`}
                      className="text-xs font-medium text-zinc-900 underline-offset-4 hover:underline"
                    >
                      {t("common.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
