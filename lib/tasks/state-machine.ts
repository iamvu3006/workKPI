import type { TaskStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TO_DO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["PENDING", "REVIEW", "CANCELLED"],
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  REVIEW: ["DONE", "IN_PROGRESS", "CANCELLED"],
  DONE: [],
  CANCELLED: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TaskStatus, to: TaskStatus): string | null {
  if (from === to) return null;
  if (!canTransition(from, to)) {
    return `Không thể chuyển từ ${from} sang ${to}.`;
  }
  return null;
}

/** Assignee cannot return to TO_DO once started. */
export function isBackwardToTodo(from: TaskStatus, to: TaskStatus): boolean {
  return to === "TO_DO" && from !== "TO_DO";
}
