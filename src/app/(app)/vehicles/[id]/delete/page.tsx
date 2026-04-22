import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { formatOdometer } from "@/lib/units";
import { Toast } from "@/app/(app)/_components/Toast";

import { deleteVehicleAction } from "../../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function DeleteVehiclePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const t = translator(user.locale);
  const { id } = await params;
  const { error } = await searchParams;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { trips: true } } },
  });
  if (!vehicle) notFound();

  const tripCount = vehicle._count.trips;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/vehicles"
        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← {t("vehicles.title")}
      </Link>
      {error ? (
        <Toast variant="error" message={error} />
      ) : null}
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">
          {t("vehicle.delete.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t("vehicle.delete.subtitle")}
        </p>

        <dl className="mt-4 space-y-2 rounded-lg bg-zinc-50 p-4 text-sm">
          <Row label={t("vehicles.form.name")} value={vehicle.name} />
          <Row
            label={t("vehicles.form.licensePlate")}
            value={vehicle.licensePlate ?? "—"}
          />
          <Row
            label={t("dashboard.col.currentOdometer")}
            value={formatOdometer(
              vehicle.currentOdometer,
              user.unit,
              user.locale,
            )}
          />
          <Row label={t("dashboard.col.trips")} value={String(tripCount)} />
        </dl>

        {tripCount > 0 ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t("vehicle.delete.blocked", { count: String(tripCount) })}
          </p>
        ) : null}

        <form
          action={deleteVehicleAction}
          className="mt-6 flex items-center gap-3"
        >
          <input type="hidden" name="vehicleId" value={vehicle.id} />
          <button
            type="submit"
            disabled={tripCount > 0}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("common.delete")}
          </button>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            {t("common.cancel")}
          </Link>
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
