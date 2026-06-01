import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { calculateAndSaveKpiForUsers } from "@/lib/kpi/persist";
import { applyOverduePenalty } from "@/lib/kpi/overdue-penalty";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { canEditTaskMetadata } from "@/lib/tasks/permissions";
import { recordStatusChange } from "@/lib/tasks/status-history";

export async function POST(request: NextRequest) {
  try {
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    if (auth.actor.role !== "MANAGER" && auth.actor.role !== "ADMIN") {
      return taskError("Chỉ Trưởng phòng mới duyệt hàng loạt.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const taskIds = Array.isArray(body.taskIds) ? (body.taskIds as string[]) : [];
    const defaultScore = Number(body.qualityScore ?? 80);
    const defaultProgress = Number(body.progressPercent ?? 100);

    if (taskIds.length === 0) {
      return taskError("Chọn ít nhất một task.", "ERR_TASK_IDS", 400);
    }
    if (taskIds.length > 50) {
      return taskError("Tối đa 50 task mỗi lần.", "ERR_LIMIT", 400);
    }
    if (!Number.isFinite(defaultScore) || defaultScore < 0 || defaultScore > 100) {
      return taskError("Điểm mặc định không hợp lệ.", "ERR_SCORE", 400);
    }

    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        deletedAt: null,
        status: "REVIEW",
        departmentId: auth.actor.role === "ADMIN" ? undefined : auth.actor.departmentId ?? undefined,
      },
      include: { assignees: true },
    });

    const approvedAt = new Date();
    let approved = 0;
    const userIdsToRecalculate = new Set<string>();

    for (const task of tasks) {
      if (!canEditTaskMetadata(task, auth.actor)) continue;

      const penalty = applyOverduePenalty(
        defaultScore,
        new Date(task.deadline),
        approvedAt
      );

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "DONE",
          progressPercent: defaultProgress,
          qualityScoreRaw: penalty.qualityScoreRaw,
          qualityScore: penalty.qualityScoreAfterPenalty,
          penaltyDays: penalty.penaltyDays,
          reviewedAt: approvedAt,
          reviewedById: auth.actor.id,
          completedAt: approvedAt,
        },
      });

      await recordStatusChange({
        taskId: task.id,
        fromStatus: "REVIEW",
        toStatus: "DONE",
        actorId: auth.actor.id,
        reason: "Duyệt hàng loạt",
        metadata: { bulk: true, qualityScore: penalty.qualityScoreAfterPenalty },
      });

      for (const a of task.assignees) {
        userIdsToRecalculate.add(a.assigneeId);
      }

      approved += 1;
    }

    if (userIdsToRecalculate.size > 0) {
      const month = approvedAt.getMonth() + 1;
      const year = approvedAt.getFullYear();
      await calculateAndSaveKpiForUsers(Array.from(userIdsToRecalculate), month, year, auth.actor.id);
    }

    return taskSuccess(
      { approved, requested: taskIds.length },
      `Đã duyệt ${approved} task`
    );
  } catch {
    return taskError("Không thể duyệt hàng loạt.", "ERR_BULK_REVIEW", 500);
  }
}
