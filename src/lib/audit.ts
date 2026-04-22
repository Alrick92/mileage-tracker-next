import { Prisma, type AuditAction, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditEntityType = "User" | "Vehicle" | "Trip";

export type WriteAuditInput = {
  actorId: string | null;
  /**
   * Pre-resolved actor email. When provided (e.g. from a session user),
   * the helper skips its own `user.findUnique` lookup. Pass this when
   * calling inside a hot loop to avoid N+1 DB round-trips inside the
   * surrounding transaction.
   */
  actorEmail?: string | null;
  actorName?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  summary: string;
  details?: Prisma.InputJsonValue;
};

/**
 * Persist an audit log entry. Snapshots the actor's email + name so that the
 * audit trail remains readable even if the user is later deleted or renamed.
 *
 * Pass a `tx` (Prisma transaction client) when the caller runs the audited
 * mutation inside `prisma.$transaction(...)` so the audit write shares the
 * same atomicity boundary.
 */
export async function writeAuditLog(
  input: WriteAuditInput,
  tx?: Prisma.TransactionClient | PrismaClient,
): Promise<void> {
  const client = tx ?? prisma;

  let actorEmail: string | null = input.actorEmail ?? null;
  let actorName: string | null = input.actorName ?? null;
  // Only fall back to a DB lookup when the caller hasn't already supplied
  // the snapshot fields.
  if (
    input.actorId &&
    input.actorEmail === undefined &&
    input.actorName === undefined
  ) {
    const actor = await client.user.findUnique({
      where: { id: input.actorId },
      select: { email: true, name: true },
    });
    actorEmail = actor?.email ?? null;
    actorName = actor?.name ?? null;
  }

  await client.auditLog.create({
    data: {
      actorId: input.actorId,
      actorEmail,
      actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      details: input.details,
    },
  });
}
