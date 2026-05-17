import type { Prisma, UserRole } from "@prisma/client";

import type { TaskActor } from "./permissions";
import { isManagerOrLeader } from "./permissions";

export function buildTaskListWhere(
  actor: TaskActor,
  params: {
    status?: string;
    assigneeId?: string;
    month?: string;
    priority?: string;
    tag?: string;
    departmentId?: string;
  }
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    parentTaskId: null,
  };

  if (params.status) {
    where.status = params.status as Prisma.EnumTaskStatusFilter;
  }
  if (params.priority) {
    where.priority = params.priority as Prisma.EnumTaskPriorityFilter;
  }
  if (params.tag) {
    where.tags = { has: params.tag };
  }
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0));
    where.deadline = { gte: start, lte: end };
  }

  if (actor.role === "DIRECTOR" || actor.role === "ADMIN") {
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.assigneeId) {
      where.assignees = { some: { assigneeId: params.assigneeId } };
    }
    return where;
  }

  where.departmentId = actor.departmentId ?? "__none__";

  if (params.assigneeId) {
    where.assignees = { some: { assigneeId: params.assigneeId } };
  }

  if (!isManagerOrLeader(actor.role)) {
    where.OR = [
      { assignees: { some: { assigneeId: actor.id } } },
      { createdById: actor.id },
    ];
  }

  return where;
}

export function canAccessDepartment(actor: TaskActor, departmentId: string): boolean {
  if (actor.role === "DIRECTOR" || actor.role === "ADMIN") return true;
  return actor.departmentId === departmentId;
}
