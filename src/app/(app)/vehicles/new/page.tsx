import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { unitShort } from "@/lib/units";
import { PageHeader, cardStyles } from "@/components/ui";

import { VehicleForm } from "./VehicleForm";

export const metadata = {
  title: "Add vehicle · Mileage Tracker",
};

export default async function NewVehiclePage() {
  const user = await requireUser();
  const t = translator(user.locale);
  const unit = unitShort(user.unit, user.locale);

  return (
    <div className="mx-auto max-w-2xl space-y-5 md:mx-0">
      <PageHeader
        back={{ href: "/vehicles", label: t("vehicles.title") }}
        title={t("vehicles.new.title")}
        subtitle={t("vehicles.new.subtitle")}
      />
      <div className={`${cardStyles} p-4 sm:p-6`}>
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
