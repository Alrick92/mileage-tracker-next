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
  const allParam = req.nextUrl.searchParams.get("all");
  const fleetAll = user.role === "ADMIN" && allParam === "1";

  const t = translator(user.locale);
  const unit = user.unit;
  const unitLabel = unitShort(unit, user.locale);

  const where = fleetAll
    ? vehicleId
      ? { vehicleId }
      : {}
    : vehicleId
      ? { vehicleId, userId: user.id }
      : { userId: user.id };

  const trips = await prisma.trip.findMany({
    where,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      vehicle: { select: { name: true, licensePlate: true } },
      user: fleetAll ? { select: { name: true, email: true } } : undefined,
    },
  });

  const rows = trips.map((trip) => {
    const distanceKm = trip.endOdometer - trip.startOdometer;
    const base = {
      date: trip.date.toISOString().slice(0, 10),
      vehicle: trip.vehicle.name,
      licensePlate: trip.vehicle.licensePlate ?? "",
      driver: trip.driverName,
      startOdometer: Math.round(kmToUnit(trip.startOdometer, unit)),
      endOdometer: Math.round(kmToUnit(trip.endOdometer, unit)),
      distance: Math.round(kmToUnit(distanceKm, unit)),
      notes: trip.notes ?? "",
    };
    if (fleetAll) {
      const tripWithUser = trip as typeof trip & {
        user?: { name: string; email: string };
      };
      return {
        ...base,
        owner: tripWithUser.user
          ? `${tripWithUser.user.name} <${tripWithUser.user.email}>`
          : "",
      };
    }
    return base;
  });

  const baseColumns = [
    { key: "date" as const, header: t("trips.col.date") },
    { key: "vehicle" as const, header: t("trips.col.vehicle") },
    { key: "licensePlate" as const, header: t("vehicles.form.licensePlate") },
    { key: "driver" as const, header: t("trips.col.driver") },
    {
      key: "startOdometer" as const,
      header: `${t("trips.col.start")} (${unitLabel})`,
    },
    {
      key: "endOdometer" as const,
      header: `${t("trips.col.end")} (${unitLabel})`,
    },
    {
      key: "distance" as const,
      header: `${t("trips.col.distance")} (${unitLabel})`,
    },
    { key: "notes" as const, header: t("trips.form.notes") },
  ];
  const columns = fleetAll
    ? [
        ...baseColumns,
        { key: "owner" as const, header: t("admin.fleet.owner") },
      ]
    : baseColumns;

  const csv = toCsv(rows, columns as never);

  const filename = vehicleId
    ? `trips-${vehicleId}.csv`
    : fleetAll
      ? `trips-fleet-${new Date().toISOString().slice(0, 10)}.csv`
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
