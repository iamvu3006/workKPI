import type { Prisma, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function recordStatusChange(params: {
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  actorId: string;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.taskStatusHistory.create({
    data: {
      taskId: params.taskId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      actorId: params.actorId,
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
    },
  });
}
