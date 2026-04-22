"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hashPassword(parsed.data.password);

  let created: { id: string; email: string; name: string };
  try {
    created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        // role, enabled, unit, locale use schema defaults
        // (USER, false, MI, EN).
      },
      select: { id: true, email: true, name: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "An account with that email already exists." };
    }
    throw err;
  }

  // Audit is best-effort: a failure here must not surface a 500 to a user
  // whose account has already been committed (they would then hit the
  // duplicate-email error on retry with no way to sign in).
  try {
    await writeAuditLog({
      actorId: created.id,
      actorEmail: created.email,
      actorName: created.name,
      action: "USER_CREATED",
      entityType: "User",
      entityId: created.id,
      summary: `${created.name} <${created.email}>`,
    });
  } catch (err) {
    console.error("registerAction: audit write failed", err);
  }

  // New users are disabled by default. No session is created.
  redirect("/pending");
}
