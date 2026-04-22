"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const UpdateSchema = z.object({
  userId: z.string().min(1),
});

const EnabledSchema = UpdateSchema.extend({
  enabled: z.enum(["true", "false"]),
});

const RoleSchema = UpdateSchema.extend({
  role: z.enum(["USER", "ADMIN"]),
});

export type AdminActionState = {
  error?: string;
};

export async function setEnabledAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = EnabledSchema.safeParse({
    userId: formData.get("userId"),
    enabled: formData.get("enabled"),
  });
  if (!parsed.success) return { error: "Invalid input." };

  if (parsed.data.userId === admin.id && parsed.data.enabled === "false") {
    return { error: "You cannot disable your own account." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { enabled: parsed.data.enabled === "true" },
  });
  revalidatePath("/admin/users");
  return {};
}

export async function setRoleAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = RoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Invalid input." };

  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    return { error: "You cannot demote yourself." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/admin/users");
  return {};
}
