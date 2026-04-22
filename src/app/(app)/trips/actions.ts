"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseOdometerToKm, type Unit } from "@/lib/units";

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
    where: { id: parsed.data.vehicleId, userId: user.id },
    select: { id: true, currentOdometer: true },
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
    await tx.trip.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        userId: user.id,
        driverName: parsed.data.driverName,
        date: new Date(parsed.data.date),
        startOdometer: startOdometerKm,
        endOdometer: endOdometerKm,
        notes: parsed.data.notes,
      },
    });

    if (endOdometerKm > vehicle.currentOdometer) {
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { currentOdometer: endOdometerKm },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${parsed.data.vehicleId}`);
  revalidatePath("/trips");
  redirect("/trips?saved=1");
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
