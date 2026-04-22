"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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
      (v) => Number.isInteger(v) && v >= 0,
      "Odometer must be a non-negative integer",
    ),
});

export type VehicleFormState = { error?: string };

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  await requireUser();
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

  await prisma.vehicle.create({
    data: {
      name: parsed.data.name,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      licensePlate: parsed.data.licensePlate,
      currentOdometer: parsed.data.currentOdometer,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  redirect("/vehicles");
}
