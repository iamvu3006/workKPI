import type { Task, UserRole } from "@prisma/client";

export interface TaskActor {
  id: string;
  role: UserRole;
  departmentId: string | null;
  teamId: string | null;
}

export function isAssignee(task: Task & { assignees?: { assigneeId: string }[] }, userId: string): boolean {
  return task.assignees?.some((a) => a.assigneeId === userId) ?? false;
}

export function isCreator(task: Task, userId: string): boolean {
  return task.createdById === userId;
}

export function isManagerOrLeader(role: UserRole): boolean {
  return role === "MANAGER" || role === "LEADER" || role === "ADMIN";
}

export function canViewTask(
  task: Task & { assignees?: { assigneeId: string }[] },
  actor: TaskActor
): boolean {
  if (actor.role === "DIRECTOR" || actor.role === "ADMIN") return true;
  if (task.departmentId !== actor.departmentId) return false;
  if (isManagerOrLeader(actor.role)) return true;
  return isAssignee(task, actor.id) || isCreator(task, actor.id);
}

export function canEditTaskMetadata(
  task: Task & { assignees?: { assigneeId: string }[] },
  actor: TaskActor
): boolean {
  if (actor.role === "DIRECTOR") return false;
  if (actor.role === "ADMIN") return true;
  if (!isManagerOrLeader(actor.role)) return false;
  if (task.departmentId !== actor.departmentId) return false;
  return isCreator(task, actor.id) || actor.role === "MANAGER";
}

export function canChangeStatus(
  task: Task & { assignees?: { assigneeId: string }[] },
  actor: TaskActor
): boolean {
  if (actor.role === "DIRECTOR") return false;
  if (canEditTaskMetadata(task, actor)) return true;
  return isAssignee(task, actor.id);
}

export function canSoftDeleteTask(
  task: Task,
  actor: TaskActor
): boolean {
  return actor.role === "MANAGER" && task.departmentId === actor.departmentId;
}

export function canCreateTask(actor: TaskActor): boolean {
  return actor.role === "MANAGER" || actor.role === "LEADER" || actor.role === "ADMIN";
}
