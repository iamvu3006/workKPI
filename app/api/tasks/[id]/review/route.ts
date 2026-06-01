import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { calculateAndSaveKpiForUsers } from "@/lib/kpi/persist";
import { applyOverduePenalty } from "@/lib/kpi/overdue-penalty";
import { createNotification } from "@/lib/notifications";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { MIN_REVIEW_REJECT_REASON_LENGTH } from "@/lib/tasks/constants";
import { canEditTaskMetadata } from "@/lib/tasks/permissions";
import { taskListInclude, serializeTask } from "@/lib/tasks/serialize";
import { recordStatusChange } from "@/lib/tasks/status-history";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignees: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);

    if (!canEditTaskMetadata(task, auth.actor)) {
      return taskError("Chỉ Trưởng phòng mới chấm nghiệm thu.", "ERR_FORBIDDEN", 403);
    }

    if (task.status !== "REVIEW") {
      return taskError("Task không ở trạng thái Review.", "ERR_STATUS", 400);
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "REJECT") {
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (reason.length < MIN_REVIEW_REJECT_REASON_LENGTH) {
        return taskError(
          `Lý do trả lại cần ít nhất ${MIN_REVIEW_REJECT_REASON_LENGTH} ký tự.`,
          "ERR_REASON",
          400
        );
      }

      const updated = await prisma.task.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          reviewRejectReason: reason,
          qualityScoreRaw: null,
          qualityScore: null,
          penaltyDays: 0,
          reviewedAt: null,
          reviewedById: null,
          reviewComment: null,
        },
        include: taskListInclude,
      });

      await recordStatusChange({
        taskId: id,
        fromStatus: "REVIEW",
        toStatus: "IN_PROGRESS",
        actorId: auth.actor.id,
        reason,
      });

      for (const a of task.assignees) {
        await createNotification({
          userId: a.assigneeId,
          type: "TASK_REJECTED",
          title: "Task bị trả lại",
          body: `"${task.title}": ${reason.slice(0, 120)}`,
          payload: { taskId: id, link: `/dashboard/tasks/${id}` },
        });
      }

      return taskSuccess(serializeTask(updated), "Đã trả lại task");
    }

    if (action !== "APPROVE") {
      return taskError("Hành động không hợp lệ.", "ERR_ACTION", 400);
    }

    const qualityScoreRaw = Number(body.qualityScore);
    if (!Number.isFinite(qualityScoreRaw) || qualityScoreRaw < 0 || qualityScoreRaw > 100) {
      return taskError("Điểm chất lượng phải từ 0 đến 100.", "ERR_SCORE", 400);
    }

    let progressPercent = Number(body.progressPercent ?? 100);
    if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return taskError("Tiến độ phải từ 0 đến 100.", "ERR_PROGRESS", 400);
    }
    progressPercent = Math.round(progressPercent);

    const approvedAt = new Date();
    const deadline = new Date(task.deadline);
    const penalty = applyOverduePenalty(qualityScoreRaw, deadline, approvedAt);
    const reviewComment =
      typeof body.comment === "string" ? body.comment.trim() || null : null;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "DONE",
        progressPercent,
        qualityScoreRaw: penalty.qualityScoreRaw,
        qualityScore: penalty.qualityScoreAfterPenalty,
        penaltyDays: penalty.penaltyDays,
        reviewedAt: approvedAt,
        reviewedById: auth.actor.id,
        reviewComment,
        completedAt: approvedAt,
        reviewRejectReason: null,
      },
      include: taskListInclude,
    });

    await recordStatusChange({
      taskId: id,
      fromStatus: "REVIEW",
      toStatus: "DONE",
      actorId: auth.actor.id,
      reason: reviewComment,
      metadata: {
        qualityScoreRaw: penalty.qualityScoreRaw,
        qualityScore: penalty.qualityScoreAfterPenalty,
        penaltyDays: penalty.penaltyDays,
        progressPercent,
      },
    });

    const userIds = updated.assignees.map((a) => a.assigneeId);
    if (userIds.length > 0) {
      const month = approvedAt.getMonth() + 1;
      const year = approvedAt.getFullYear();
      await calculateAndSaveKpiForUsers(userIds, month, year, auth.actor.id);
    }

    return taskSuccess(
      {
        ...serializeTask(updated),
        penalty: {
          penaltyDays: penalty.penaltyDays,
          penaltyPoints: penalty.penaltyPoints,
          qualityScoreRaw: penalty.qualityScoreRaw,
          qualityScoreAfterPenalty: penalty.qualityScoreAfterPenalty,
        },
      },
      "Duyệt nghiệm thu thành công"
    );
  } catch {
    return taskError("Không thể chấm nghiệm thu.", "ERR_REVIEW", 500);
  }
}
