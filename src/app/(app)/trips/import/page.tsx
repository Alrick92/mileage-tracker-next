import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { unitShort } from "@/lib/units";

import { ImportForm } from "./ImportForm";

export const metadata = {
  title: "Import trips · Mileage Tracker",
};

export const dynamic = "force-dynamic";

export default async function ImportTripsPage() {
  const user = await requireUser();
  const t = translator(user.locale);
  const unitLabel = unitShort(user.unit, user.locale);

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, licensePlate: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/trips"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← {t("trips.title")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("trips.import.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("trips.import.subtitle", { unit: unitLabel })}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
          <div className="font-medium text-zinc-900">
            {t("trips.import.formatHeading")}
          </div>
          <p className="mt-1">{t("trips.import.formatBody")}</p>
          <code className="mt-2 block overflow-x-auto rounded bg-white px-2 py-1 font-mono text-[11px] text-zinc-800">
            Date,Driver,Start ({unitLabel}),End ({unitLabel}),Notes
          </code>
        </div>

        <ImportForm
          vehicles={vehicles}
          labels={{
            vehicle: t("trips.import.vehicle"),
            vehiclePlaceholder: t("trips.import.vehiclePlaceholder"),
            vehicleHelp: t("trips.import.vehicleHelp"),
            vehicleEmpty: t("trips.import.vehicleEmpty"),
            chooseFile: t("trips.import.chooseFile"),
            fileHelp: t("trips.import.fileHelp"),
            submit: t("trips.import.submit"),
            submitting: t("trips.import.submitting"),
            cancel: t("common.cancel"),
            resultImported: t("trips.import.resultImported"),
            resultSkipped: t("trips.import.resultSkipped"),
            resultErrorsHeading: t("trips.import.resultErrorsHeading"),
            rowLabel: t("trips.import.rowLabel"),
          }}
        />
      </div>
    </div>
  );
}
