"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

function safeBack(vehicleId: string, search?: string): string {
  return `/admin/vehicles/${vehicleId}/assignments${search ?? ""}`;
}

export async function adminAssignUserAction(
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
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
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, name: true, licensePlate: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    }),
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

  // Atomic check-create-audit: wrap in a single transaction so concurrent
  // double-submits or parallel admin requests can't each pass the "new"
  // check and write duplicate audit entries.
  await prisma.$transaction(async (tx) => {
    const existingAssignment = await tx.vehicleAssignment.findUnique({
      where: { vehicleId_userId: { vehicleId, userId } },
      select: { vehicleId: true },
    });
    if (existingAssignment) {
      return; // idempotent: no-op, no audit
    }
    await tx.vehicleAssignment.create({
      data: { vehicleId, userId },
    });
    await writeAuditLog(
      {
        actorId: admin.id,
        actorEmail: admin.email,
        actorName: admin.name,
        action: "VEHICLE_UPDATED",
        entityType: "Vehicle",
        entityId: vehicleId,
        summary: vehicle.licensePlate
          ? `${vehicle.name} (${vehicle.licensePlate})`
          : vehicle.name,
        details: {
          change: "driverAssigned",
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
        },
      },
      tx,
    );
  });

  revalidatePath(`/admin/vehicles/${vehicleId}/assignments`);
  revalidatePath("/admin/fleet");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(safeBack(vehicleId, "?assigned=1"));
}

export async function adminUnassignUserAction(
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
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

  const [vehicle, user] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, name: true, licensePlate: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    }),
  ]);

  const deleted = await prisma.vehicleAssignment
    .delete({
      where: { vehicleId_userId: { vehicleId, userId } },
    })
    .catch(() => null);

  if (deleted && vehicle && user) {
    await writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorName: admin.name,
      action: "VEHICLE_UPDATED",
      entityType: "Vehicle",
      entityId: vehicleId,
      summary: vehicle.licensePlate
        ? `${vehicle.name} (${vehicle.licensePlate})`
        : vehicle.name,
      details: {
        change: "driverUnassigned",
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      },
    });
  }

  revalidatePath(`/admin/vehicles/${vehicleId}/assignments`);
  revalidatePath("/admin/fleet");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(safeBack(vehicleId, "?unassigned=1"));
}
