import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicleId = req.nextUrl.searchParams.get("vehicleId") ?? undefined;

  const trips = await prisma.trip.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      vehicle: {
        select: { name: true, licensePlate: true },
      },
    },
  });

  const rows = trips.map((t) => ({
    date: t.date.toISOString().slice(0, 10),
    vehicle: t.vehicle.name,
    licensePlate: t.vehicle.licensePlate ?? "",
    driver: t.driverName,
    startOdometer: t.startOdometer,
    endOdometer: t.endOdometer,
    distanceKm: t.endOdometer - t.startOdometer,
    fuelLiters: t.fuelLiters ?? "",
    notes: t.notes ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "date", header: "Date" },
    { key: "vehicle", header: "Vehicle" },
    { key: "licensePlate", header: "License plate" },
    { key: "driver", header: "Driver" },
    { key: "startOdometer", header: "Start odometer" },
    { key: "endOdometer", header: "End odometer" },
    { key: "distanceKm", header: "Distance (km)" },
    { key: "fuelLiters", header: "Fuel (L)" },
    { key: "notes", header: "Notes" },
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
