import { prisma } from "@/lib/db/prisma";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "TASK_REJECTED"
  | "TASK_PENDING"
  | "REVIEW_NEEDED"
  | "EXTEND_REQUESTED"
  | "KPI_PUBLISHED"
  | "USER_DISABLED";

/**
 * Create a notification with simple dedupe rules.
 * - If `dedupeFields` are provided, we consider notifications with the same type and matching
 *   payload keys as duplicates and will not create a new one.
 */
export async function sendNotification(options: {
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  payload?: Record<string, any>;
  dedupeFields?: string[]; // keys inside payload to use for dedupe, e.g. ['taskId']
}) {
  const { userId, type, title, body, payload = {}, dedupeFields = [] } = options;

  // Build where clause if dedupeFields provided
  if (dedupeFields.length > 0) {
    const andClauses: any = { userId, type };

    // We'll check JSON payload equality for the provided keys
    // Prisma/Postgres: payload ->> 'key' = value
    // But Prisma doesn't support json path in query strongly; we'll fetch recent notifications and filter in JS

    const recent = await prisma.notification.findMany({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, payload: true, createdAt: true, readAt: true },
    });

    const exists = recent.some((n) => {
      try {
        const p = n.payload as Record<string, any>;
        return dedupeFields.every((k) => String(p?.[k]) === String(payload?.[k]));
      } catch (e) {
        return false;
      }
    });

    if (exists) return null;
  }

  const created = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      payload,
    },
  });

  return created;
}
