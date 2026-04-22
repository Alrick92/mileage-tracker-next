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

const AdminEmailSchema = UpdateSchema.extend({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

const AdminPasswordSchema = UpdateSchema.extend({
  newPassword: z.string().min(10, "Password must be at least 10 characters."),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

export async function adminUpdateEmailAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = AdminEmailSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true },
  });
  if (!target) return { error: "User not found." };

  if (target.email === parsed.data.email) {
    return { error: "New email matches the current email." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing && existing.id !== target.id) {
    return { error: "An account with that email already exists." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { email: parsed.data.email },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${target.id}/edit`);
  redirect(`/admin/users/${target.id}/edit?emailUpdated=1`);
}

export async function adminSetPasswordAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = AdminPasswordSchema.safeParse({
    userId: formData.get("userId"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!target) return { error: "User not found." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, mustChangePassword: false },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${target.id}/edit`);
  redirect(`/admin/users/${target.id}/edit?passwordUpdated=1`);
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
