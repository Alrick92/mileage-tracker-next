import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { translator } from "@/lib/i18n";
import { kmToUnit, unitShort } from "@/lib/units";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.enabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicleId = req.nextUrl.searchParams.get("vehicleId") ?? undefined;
  const t = translator(user.locale);
  const unit = user.unit;
  const unitLabel = unitShort(unit, user.locale);

  const trips = await prisma.trip.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      vehicle: {
        select: { name: true, licensePlate: true },
      },
    },
  });

  const rows = trips.map((trip) => {
    const distanceKm = trip.endOdometer - trip.startOdometer;
    return {
      date: trip.date.toISOString().slice(0, 10),
      vehicle: trip.vehicle.name,
      licensePlate: trip.vehicle.licensePlate ?? "",
      driver: trip.driverName,
      startOdometer: Math.round(kmToUnit(trip.startOdometer, unit)),
      endOdometer: Math.round(kmToUnit(trip.endOdometer, unit)),
      distance: Math.round(kmToUnit(distanceKm, unit)),
      fuelLiters: trip.fuelLiters ?? "",
      notes: trip.notes ?? "",
    };
  });

  const csv = toCsv(rows, [
    { key: "date", header: t("trips.col.date") },
    { key: "vehicle", header: t("trips.col.vehicle") },
    { key: "licensePlate", header: t("vehicles.form.licensePlate") },
    { key: "driver", header: t("trips.col.driver") },
    { key: "startOdometer", header: `${t("trips.col.start")} (${unitLabel})` },
    { key: "endOdometer", header: `${t("trips.col.end")} (${unitLabel})` },
    { key: "distance", header: `${t("trips.col.distance")} (${unitLabel})` },
    { key: "fuelLiters", header: `${t("trips.col.fuel")} (L)` },
    { key: "notes", header: t("trips.form.notes") },
  ]);

  const filename = vehicleId
    ? `trips-${vehicleId}.csv`
    : `trips-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
