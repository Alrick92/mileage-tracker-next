import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { unitShort } from "@/lib/units";

import { VehicleForm } from "./VehicleForm";

export const metadata = {
  title: "Add vehicle · Mileage Tracker",
};

export default async function NewVehiclePage() {
  const user = await requireUser();
  const t = translator(user.locale);
  const unit = unitShort(user.unit, user.locale);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/vehicles"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← {t("vehicles.title")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("vehicles.new.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("vehicles.new.subtitle")}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <VehicleForm
          labels={{
            name: t("vehicles.form.name"),
            licensePlate: t("vehicles.form.licensePlate"),
            make: t("vehicles.form.make"),
            model: t("vehicles.form.model"),
            year: t("vehicles.form.year"),
            currentOdometer: t("vehicles.form.currentOdometer", { unit }),
            save: t("vehicles.form.save"),
            saving: t("common.saving"),
            cancel: t("common.cancel"),
          }}
        />
      </div>
    </div>
  );
}
