"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseOdometerToKm, type Unit } from "@/lib/units";
import { writeAuditLog } from "@/lib/audit";

const VehicleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  make: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : null)),
  model: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : null)),
  year: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1900 && v <= 2100),
      "Invalid year",
    ),
  licensePlate: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v ? v : null)),
  currentOdometer: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .refine(
      (v) => Number.isFinite(v) && v >= 0,
      "Odometer must be a non-negative number",
    ),
});

export type VehicleFormState = { error?: string };

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const user = await requireUser();
  const parsed = VehicleSchema.safeParse({
    name: formData.get("name"),
    make: formData.get("make") ?? undefined,
    model: formData.get("model") ?? undefined,
    year: formData.get("year") ?? undefined,
    licensePlate: formData.get("licensePlate") ?? undefined,
    currentOdometer: formData.get("currentOdometer") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // The form takes the odometer in the user's preferred unit. Convert to the
  // canonical kilometer value before persisting.
  const currentOdometerKm = parseOdometerToKm(
    parsed.data.currentOdometer,
    user.unit as Unit,
  );

  await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.create({
      data: {
        name: parsed.data.name,
        make: parsed.data.make,
        model: parsed.data.model,
        year: parsed.data.year,
        licensePlate: parsed.data.licensePlate,
        initialOdometer: currentOdometerKm,
        currentOdometer: currentOdometerKm,
      },
    });
    await tx.vehicleAssignment.create({
      data: { vehicleId: vehicle.id, userId: user.id },
    });
    await writeAuditLog(
      {
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.name,
        action: "VEHICLE_CREATED",
        entityType: "Vehicle",
        entityId: vehicle.id,
        summary: vehicle.licensePlate
          ? `${vehicle.name} (${vehicle.licensePlate})`
          : vehicle.name,
        details: {
          initialOdometerKm: currentOdometerKm,
        },
      },
      tx,
    );
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  redirect("/vehicles?saved=1");
}

export async function deleteVehicleAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!vehicleId) {
    redirect("/vehicles?error=" + encodeURIComponent("Missing vehicle id"));
  }

  // Only admins can delete a shared vehicle; a regular user can delete a
  // vehicle only when they are its sole assignee. This protects the other
  // drivers of a shared vehicle from one of them wiping it out.
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      assignments: { some: { userId: user.id } },
    },
    select: {
      id: true,
      _count: { select: { trips: true, assignments: true } },
    },
  });
  if (!vehicle) {
    redirect("/vehicles?error=" + encodeURIComponent("Vehicle not found"));
  }
  if (vehicle._count.trips > 0) {
    redirect(
      `/vehicles/${vehicleId}/delete?error=` +
        encodeURIComponent(
          `Cannot delete: vehicle still has ${vehicle._count.trips} trip(s). Delete them first.`,
        ),
    );
  }
  if (vehicle._count.assignments > 1 && user.role !== "ADMIN") {
    redirect(
      `/vehicles/${vehicleId}/delete?error=` +
        encodeURIComponent(
          "This vehicle is shared with other drivers. Only an administrator can delete it.",
        ),
    );
  }

  await prisma.vehicle.delete({ where: { id: vehicle.id } });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  redirect("/vehicles?deleted=1");
}
