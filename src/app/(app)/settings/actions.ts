"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  getCurrentUser,
  requireUser,
  verifyPassword,
} from "@/lib/auth";

const PreferencesSchema = z.object({
  unit: z.enum(["KM", "MI"]),
  locale: z.enum(["EN", "FR"]),
});

export type SettingsFormState = {
  error?: string;
  success?: boolean;
};

export async function updatePreferencesAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = PreferencesSchema.safeParse({
    unit: formData.get("unit"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    return { error: "Invalid selection." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      unit: parsed.data.unit,
      locale: parsed.data.locale,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

const EmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  currentPassword: z.string().min(1, "Current password is required."),
});

export type UpdateEmailState = {
  error?: string;
};

export async function updateEmailAction(
  _prev: UpdateEmailState,
  formData: FormData,
): Promise<UpdateEmailState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.enabled) redirect("/pending");

  const parsed = EmailSchema.safeParse({
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.email === user.email) {
    return { error: "New email matches the current email." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true, name: true },
  });
  if (!dbUser) redirect("/login");

  const ok = await verifyPassword(
    parsed.data.currentPassword,
    dbUser.passwordHash,
  );
  if (!ok) {
    return { error: "Current password is incorrect." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing && existing.id !== user.id) {
    return { error: "An account with that email already exists." };
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { email: parsed.data.email },
  });

  // Re-sign the session so the JWT's email claim reflects the new value.
  await createSession({
    id: dbUser.id,
    email: parsed.data.email,
    name: dbUser.name,
  });

  revalidatePath("/", "layout");
  redirect("/settings?emailUpdated=1");
}
