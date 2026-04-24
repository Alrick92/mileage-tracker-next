import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { renderMileageReportPdf } from "@/lib/reports-pdf";
import type { Unit } from "@/lib/units";

export const dynamic = "force-dynamic";
// pdfkit relies on Node fs/stream APIs; pin this route to the Node runtime
// rather than letting it fall through to the default edge-compatible runtime.
export const runtime = "nodejs";

function parseDate(input: string | null): Date | null {
  if (!input) return null;
  // Accept YYYY-MM-DD; reject anything else to keep the URL tidy.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.enabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fromRaw = req.nextUrl.searchParams.get("from");
  const toRaw = req.nextUrl.searchParams.get("to");
  const vehicleIdParam = req.nextUrl.searchParams.get("vehicleId");

  const from = parseDate(fromRaw);
  const to = parseDate(toRaw);
  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' query params are required (YYYY-MM-DD)." },
      { status: 400 },
    );
  }
  if (from.getTime() > to.getTime()) {
    return NextResponse.json(
      { error: "'from' must be on or before 'to'." },
      { status: 400 },
    );
  }

  // Include the full `to` day: shift the upper bound to the next midnight.
  const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);

  // Scope vehicles to the ones the user is assigned to. Optional filter.
  const vehicles = await prisma.vehicle.findMany({
    where: {
      assignments: { some: { userId: user.id } },
      ...(vehicleIdParam ? { id: vehicleIdParam } : {}),
    },
    select: { id: true, name: true, licensePlate: true },
    orderBy: [{ name: "asc" }],
  });

  if (vehicleIdParam && vehicles.length === 0) {
    return NextResponse.json(
      { error: "Vehicle not found in your assignments." },
      { status: 404 },
    );
  }

  // Pull this user's trips across the selected vehicles in one round-trip and
  // group by vehicle in memory — per-vehicle queries would multiply the DB
  // load without a payoff at this scale.
  const trips = await prisma.trip.findMany({
    where: {
      userId: user.id,
      vehicleId: { in: vehicles.map((v) => v.id) },
      date: { gte: from, lt: toExclusive },
    },
    orderBy: [{ vehicleId: "asc" }, { date: "asc" }, { createdAt: "asc" }],
    select: {
      vehicleId: true,
      date: true,
      driverName: true,
      startOdometer: true,
      endOdometer: true,
      notes: true,
    },
  });

  const tripsByVehicle = new Map<string, typeof trips>();
  for (const trip of trips) {
    const bucket = tripsByVehicle.get(trip.vehicleId) ?? [];
    bucket.push(trip);
    tripsByVehicle.set(trip.vehicleId, bucket);
  }

  const sections = vehicles.map((v) => ({
    vehicleName: v.name,
    licensePlate: v.licensePlate,
    trips: (tripsByVehicle.get(v.id) ?? []).map((trip) => ({
      date: trip.date,
      driverName: trip.driverName,
      startOdometerKm: trip.startOdometer,
      endOdometerKm: trip.endOdometer,
      notes: trip.notes,
    })),
  }));

  const pdf = await renderMileageReportPdf({
    ownerName: user.name,
    ownerEmail: user.email,
    rangeFrom: from,
    rangeTo: to,
    generatedAt: new Date(),
    unit: user.unit as Unit,
    locale: user.locale,
    sections,
  });

  const fromStr = fromRaw ?? from.toISOString().slice(0, 10);
  const toStr = toRaw ?? to.toISOString().slice(0, 10);
  const filename = `mileage-report-${user.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${fromStr}_to_${toStr}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
