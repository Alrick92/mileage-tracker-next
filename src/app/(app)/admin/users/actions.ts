"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

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

function generateTempPassword(length = 14): string {
  // URL-safe, human-copy-friendly. Avoid ambiguous chars.
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  // Rejection sampling: only accept bytes within the largest multiple of
  // alphabet.length that fits in a byte, so every character is chosen with
  // exactly uniform probability (no modulo bias).
  const threshold = 256 - (256 % alphabet.length);
  let out = "";
  while (out.length < length) {
    const chunk = randomBytes((length - out.length) * 2);
    for (let i = 0; i < chunk.length && out.length < length; i++) {
      if (chunk[i] < threshold) {
        out += alphabet[chunk[i] % alphabet.length];
      }
    }
  }
  return out;
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    redirect("/admin/users");
  }
  if (userId === admin.id) {
    redirect(
      "/admin/users?error=" +
        encodeURIComponent("Use your own Change password page instead."),
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) {
    redirect("/admin/users?error=" + encodeURIComponent("User not found."));
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  // Hand the plaintext off via a short-lived httpOnly cookie so it never
  // shows up in the URL, browser history, referer headers, or server logs.
  const cookieStore = await cookies();
  cookieStore.set({
    name: `mt_temp_pw_${userId}`,
    value: tempPassword,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/admin/users/${userId}/reset-password`,
    maxAge: 60,
  });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${userId}/reset-password`);
}
