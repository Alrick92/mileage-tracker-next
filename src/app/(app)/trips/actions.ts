"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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
        (v) => Number.isInteger(v) && v >= 0,
        "Start odometer must be a non-negative integer",
      ),
    endOdometer: z
      .string()
      .min(1, "End odometer is required")
      .transform(Number)
      .refine(
        (v) => Number.isInteger(v) && v >= 0,
        "End odometer must be a non-negative integer",
      ),
    fuelLiters: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null))
      .refine(
        (v) => v === null || (Number.isFinite(v) && v >= 0),
        "Fuel must be a non-negative number",
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
    fuelLiters: formData.get("fuelLiters") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parsed.data.vehicleId },
    select: { id: true, currentOdometer: true },
  });
  if (!vehicle) {
    return { error: "Vehicle not found." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.trip.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        userId: user.id,
        driverName: parsed.data.driverName,
        date: new Date(parsed.data.date),
        startOdometer: parsed.data.startOdometer,
        endOdometer: parsed.data.endOdometer,
        fuelLiters: parsed.data.fuelLiters,
        notes: parsed.data.notes,
      },
    });

    if (parsed.data.endOdometer > vehicle.currentOdometer) {
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { currentOdometer: parsed.data.endOdometer },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${parsed.data.vehicleId}`);
  revalidatePath("/trips");
  redirect("/trips");
}
