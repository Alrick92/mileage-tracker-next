"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseOdometerToKm, type Unit } from "@/lib/units";

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

  try {
    await prisma.vehicle.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        make: parsed.data.make,
        model: parsed.data.model,
        year: parsed.data.year,
        licensePlate: parsed.data.licensePlate,
        initialOdometer: currentOdometerKm,
        currentOdometer: currentOdometerKm,
      },
    });
  } catch (err: unknown) {
    // Prisma unique violation on (userId, licensePlate) when plate reused
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return { error: "You already have a vehicle with that license plate." };
    }
    throw err;
  }

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

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId: user.id },
    select: { id: true, _count: { select: { trips: true } } },
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

  await prisma.vehicle.delete({ where: { id: vehicle.id } });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  redirect("/vehicles?deleted=1");
}
