"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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
