import { prisma } from "@/lib/db/prisma";

export type AuditAction = "login" | "logout" | "reset_password";

interface AuditLogInput {
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata = {},
}: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
      },
    });
  } catch (error) {
    // Log audit failures but don't throw - audit shouldn't break the app
    console.error("Audit log write failed:", error);
  }
}
