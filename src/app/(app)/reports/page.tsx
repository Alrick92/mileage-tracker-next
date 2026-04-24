import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { unitShort } from "@/lib/units";

export const metadata = {
  title: "Reports · Mileage Tracker",
};

export const dynamic = "force-dynamic";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage() {
  const user = await requireUser();
  const t = translator(user.locale);
  const unitLabel = unitShort(user.unit, user.locale);

  const vehicles = await prisma.vehicle.findMany({
    where: { assignments: { some: { userId: user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, licensePlate: true },
  });

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultFrom = isoDate(thirtyDaysAgo);
  const defaultTo = isoDate(today);

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("reports.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("reports.subtitle", { unit: unitLabel })}
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        {vehicles.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("reports.noVehicles")}
          </p>
        ) : (
          <form
            action="/api/reports/trips"
            method="GET"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700">
                {t("reports.from")}
                <input
                  type="date"
                  name="from"
                  required
                  defaultValue={defaultFrom}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                {t("reports.to")}
                <input
                  type="date"
                  name="to"
                  required
                  defaultValue={defaultTo}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-zinc-700">
              {t("reports.vehicle")}
              <select
                name="vehicleId"
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                defaultValue=""
              >
                <option value="">{t("reports.vehicleAll")}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate
                      ? `${v.name} (${v.licensePlate})`
                      : v.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                {t("reports.vehicleHelp")}
              </span>
            </label>

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {t("reports.download")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
