"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseOdometerToKm, type Unit } from "@/lib/units";
import { writeAuditLog } from "@/lib/audit";

const TripSchema = z
  .object({
    vehicleId: z.string().min(1, "Vehicle is required"),
    driverName: z.string().trim().min(1, "Driver name is required").max(120),
    date: z
      .string()
      .min(1, "Date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
    startOdometer: z
      .string()
      .min(1, "Start odometer is required")
      .transform(Number)
      .refine(
        (v) => Number.isFinite(v) && v >= 0,
        "Start odometer must be a non-negative number",
      ),
    endOdometer: z
      .string()
      .min(1, "End odometer is required")
      .transform(Number)
      .refine(
        (v) => Number.isFinite(v) && v >= 0,
        "End odometer must be a non-negative number",
      ),
    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((data) => data.endOdometer >= data.startOdometer, {
    message: "End odometer must be greater than or equal to start odometer",
    path: ["endOdometer"],
  });

export type TripFormState = { error?: string };

export async function createTripAction(
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await requireUser();

  const parsed = TripSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    driverName: formData.get("driverName"),
    date: formData.get("date"),
    startOdometer: formData.get("startOdometer"),
    endOdometer: formData.get("endOdometer"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: parsed.data.vehicleId,
      assignments: { some: { userId: user.id } },
    },
    select: { id: true, name: true, licensePlate: true, currentOdometer: true },
  });
  if (!vehicle) {
    return { error: "Vehicle not found." };
  }

  // Inputs arrive in the user's preferred unit. Convert to canonical km for
  // storage and odometer-update logic.
  const unit = user.unit as Unit;
  const startOdometerKm = parseOdometerToKm(parsed.data.startOdometer, unit);
  const endOdometerKm = parseOdometerToKm(parsed.data.endOdometer, unit);

  await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        userId: user.id,
        driverName: parsed.data.driverName,
        date: new Date(parsed.data.date),
        startOdometer: startOdometerKm,
        endOdometer: endOdometerKm,
        notes: parsed.data.notes,
      },
      select: { id: true, date: true },
    });

    if (endOdometerKm > vehicle.currentOdometer) {
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { currentOdometer: endOdometerKm },
      });
    }

    await writeAuditLog(
      {
        actorId: user.id,
        action: "TRIP_CREATED",
        entityType: "Trip",
        entityId: trip.id,
        summary: `${trip.date.toISOString().slice(0, 10)} · ${
          vehicle.licensePlate
            ? `${vehicle.name} (${vehicle.licensePlate})`
            : vehicle.name
        } · ${startOdometerKm}→${endOdometerKm} km`,
        details: {
          vehicleId: vehicle.id,
          startOdometerKm,
          endOdometerKm,
        },
      },
      tx,
    );
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${parsed.data.vehicleId}`);
  revalidatePath("/trips");
  redirect("/trips?saved=1");
}

export async function updateTripAction(
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await requireUser();

  const tripId = String(formData.get("tripId") ?? "");
  if (!tripId) {
    return { error: "Missing trip id." };
  }

  const parsed = TripSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    driverName: formData.get("driverName"),
    date: formData.get("date"),
    startOdometer: formData.get("startOdometer"),
    endOdometer: formData.get("endOdometer"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.trip.findFirst({
    where: { id: tripId, userId: user.id },
    select: { id: true, vehicleId: true },
  });
  if (!existing) {
    return { error: "Trip not found." };
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: parsed.data.vehicleId,
      assignments: { some: { userId: user.id } },
    },
    select: {
      id: true,
      name: true,
      licensePlate: true,
      initialOdometer: true,
    },
  });
  if (!vehicle) {
    return { error: "Vehicle not found." };
  }

  const unit = user.unit as Unit;
  const startOdometerKm = parseOdometerToKm(parsed.data.startOdometer, unit);
  const endOdometerKm = parseOdometerToKm(parsed.data.endOdometer, unit);

  // Collect every vehicle whose currentOdometer could change:
  // - the new vehicle (because of the new endOdometer)
  // - the old vehicle, when reassigning, because removing this trip may
  //   lower its max endOdometer.
  const affectedVehicleIds = new Set<string>([vehicle.id, existing.vehicleId]);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.trip.update({
      where: { id: existing.id },
      data: {
        vehicleId: vehicle.id,
        driverName: parsed.data.driverName,
        date: new Date(parsed.data.date),
        startOdometer: startOdometerKm,
        endOdometer: endOdometerKm,
        notes: parsed.data.notes,
      },
      select: { id: true, date: true },
    });
    await writeAuditLog(
      {
        actorId: user.id,
        action: "TRIP_UPDATED",
        entityType: "Trip",
        entityId: updated.id,
        summary: `${updated.date.toISOString().slice(0, 10)} · ${
          vehicle.licensePlate
            ? `${vehicle.name} (${vehicle.licensePlate})`
            : vehicle.name
        } · ${startOdometerKm}→${endOdometerKm} km`,
        details: {
          vehicleId: vehicle.id,
          previousVehicleId: existing.vehicleId,
          startOdometerKm,
          endOdometerKm,
        },
      },
      tx,
    );

    for (const vid of affectedVehicleIds) {
      const [veh, agg] = await Promise.all([
        tx.vehicle.findUnique({
          where: { id: vid },
          select: { initialOdometer: true },
        }),
        tx.trip.aggregate({
          where: { vehicleId: vid },
          _max: { endOdometer: true },
        }),
      ]);
      if (!veh) continue;
      const recomputed = Math.max(
        agg._max.endOdometer ?? 0,
        veh.initialOdometer,
      );
      await tx.vehicle.update({
        where: { id: vid },
        data: { currentOdometer: recomputed },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicle.id}`);
  if (existing.vehicleId !== vehicle.id) {
    revalidatePath(`/vehicles/${existing.vehicleId}`);
  }
  revalidatePath("/trips");
  revalidatePath(`/trips/${existing.id}`);
  redirect(`/trips/${existing.id}?updated=1`);
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Missing trip id"));

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: user.id },
    select: {
      id: true,
      vehicleId: true,
      vehicle: { select: { initialOdometer: true } },
    },
  });
  if (!trip) {
    redirect("/trips?error=" + encodeURIComponent("Trip not found"));
  }

  const initialOdometer = trip.vehicle.initialOdometer;

  await prisma.$transaction(async (tx) => {
    await tx.trip.delete({ where: { id: trip.id } });

    const max = await tx.trip.aggregate({
      where: { vehicleId: trip.vehicleId },
      _max: { endOdometer: true },
    });
    // Floor currentOdometer at the vehicle's creation-time reading so that
    // deleting trips never loses the original calibration.
    const recomputed = Math.max(max._max.endOdometer ?? 0, initialOdometer);
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { currentOdometer: recomputed },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/trips");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${trip.vehicleId}`);
  redirect("/trips?deleted=1");
}
