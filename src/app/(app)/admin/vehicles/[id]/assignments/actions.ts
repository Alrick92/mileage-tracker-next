"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function safeBack(vehicleId: string, search?: string): string {
  return `/admin/vehicles/${vehicleId}/assignments${search ?? ""}`;
}

export async function adminAssignUserAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!vehicleId || !userId) {
    redirect(
      safeBack(
        vehicleId,
        "?error=" + encodeURIComponent("Missing vehicle or user id."),
      ),
    );
  }

  const [vehicle, user] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);
  if (!vehicle) {
    redirect(
      safeBack(
        vehicleId,
        "?error=" + encodeURIComponent("Vehicle not found."),
      ),
    );
  }
  if (!user) {
    redirect(
      safeBack(
        vehicleId,
        "?error=" + encodeURIComponent("User not found."),
      ),
    );
  }

  // upsert via unique composite so re-submitting the form is idempotent
  await prisma.vehicleAssignment.upsert({
    where: { vehicleId_userId: { vehicleId, userId } },
    create: { vehicleId, userId },
    update: {},
  });

  revalidatePath(`/admin/vehicles/${vehicleId}/assignments`);
  revalidatePath("/admin/fleet");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(safeBack(vehicleId, "?assigned=1"));
}

export async function adminUnassignUserAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!vehicleId || !userId) {
    redirect(
      safeBack(
        vehicleId,
        "?error=" + encodeURIComponent("Missing vehicle or user id."),
      ),
    );
  }

  const remaining = await prisma.vehicleAssignment.count({
    where: { vehicleId },
  });
  if (remaining <= 1) {
    redirect(
      safeBack(
        vehicleId,
        "?error=" +
          encodeURIComponent(
            "Cannot remove the last driver. Assign another user first or delete the vehicle.",
          ),
      ),
    );
  }

  await prisma.vehicleAssignment
    .delete({
      where: { vehicleId_userId: { vehicleId, userId } },
    })
    .catch(() => {
      // no-op if the row is already gone
    });

  revalidatePath(`/admin/vehicles/${vehicleId}/assignments`);
  revalidatePath("/admin/fleet");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(safeBack(vehicleId, "?unassigned=1"));
}
