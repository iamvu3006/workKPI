import { prisma } from "@/lib/db/prisma";
import type { TaskPriority } from "@prisma/client";

import {
  VALID_WEIGHTS,
  WEIGHT_MAX_PERCENT,
  WEIGHT_WARN_PERCENT,
  type TaskWeight,
} from "./constants";

export function isValidWeight(weight: number): weight is TaskWeight {
  return (VALID_WEIGHTS as readonly number[]).includes(weight);
}

export function getMonthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export async function getAssigneeMonthlyWeight(
  assigneeId: string,
  year: number,
  month: number,
  excludeTaskId?: string
): Promise<number> {
  const { start, end } = getMonthBounds(year, month);

  const assignments = await prisma.taskAssignee.findMany({
    where: {
      assigneeId,
      task: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "DONE"] },
        ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
        deadline: { gte: start, lte: end },
      },
    },
    include: { task: { select: { weight: true } } },
  });

  return assignments.reduce((sum, a) => sum + a.task.weight, 0);
}

export interface WeightCheckResult {
  currentTotal: number;
  projectedTotal: number;
  level: "ok" | "warn" | "error";
  message?: string;
}

export async function checkAssigneeWeight(
  assigneeId: string,
  weight: number,
  deadline: Date,
  priority: TaskPriority,
  urgentOverrideReason?: string | null,
  excludeTaskId?: string
): Promise<WeightCheckResult> {
  const year = deadline.getUTCFullYear();
  const month = deadline.getUTCMonth() + 1;
  const currentTotal = await getAssigneeMonthlyWeight(assigneeId, year, month, excludeTaskId);
  const projectedTotal = currentTotal + weight;

  if (projectedTotal > WEIGHT_MAX_PERCENT) {
    if (priority === "URGENT" && urgentOverrideReason?.trim()) {
      return {
        currentTotal,
        projectedTotal,
        level: "warn",
        message: "Vượt 100% trọng số tháng — đã ghi nhận do task khẩn cấp.",
      };
    }
    return {
      currentTotal,
      projectedTotal,
      level: "error",
      message: `Tổng trọng số tháng sẽ là ${projectedTotal}% (tối đa 100%). Task khẩn cấp cần ghi lý do.`,
    };
  }

  if (projectedTotal > WEIGHT_WARN_PERCENT) {
    return {
      currentTotal,
      projectedTotal,
      level: "warn",
      message: `Cảnh báo: trọng số tháng đạt ${projectedTotal}% (ngưỡng cảnh báo 80%).`,
    };
  }

  return { currentTotal, projectedTotal, level: "ok" };
}
