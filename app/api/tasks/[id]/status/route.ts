import { NextRequest } from "next/server";
import type { PendingBlockType, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { hasIncompleteChecklist } from "@/lib/tasks/checklist";
import { canChangeStatus, canEditTaskMetadata } from "@/lib/tasks/permissions";
import { taskListInclude, serializeTask } from "@/lib/tasks/serialize";
import { recordStatusChange } from "@/lib/tasks/status-history";
import { assertTransition, isBackwardToTodo } from "@/lib/tasks/state-machine";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const body = await request.json();
    const status = body.status as TaskStatus;
    const validStatuses = ["TO_DO", "IN_PROGRESS", "PENDING", "REVIEW", "DONE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return taskError("Trạng thái không hợp lệ.", "ERR_STATUS", 400);
    }

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignees: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canChangeStatus(task, auth.actor)) {
      return taskError("Không có quyền đổi trạng thái.", "ERR_FORBIDDEN", 403);
    }

    if (isBackwardToTodo(task.status, status)) {
      return taskError("Không thể quay lại To-Do sau khi đã bắt đầu.", "ERR_TRANSITION", 400);
    }

    const transitionError = assertTransition(task.status, status);
    if (transitionError) return taskError(transitionError, "ERR_TRANSITION", 400);

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (status === "PENDING") {
      if (reason.length < 10) {
        return taskError("Cần nhập lý do vướng mắc (ít nhất 10 ký tự).", "ERR_REASON", 400);
      }
    }

    if (status === "REVIEW") {
      if (await hasIncompleteChecklist(id)) {
        return taskError("Hoàn thành checklist trước khi nộp Review.", "ERR_CHECKLIST", 400);
      }
    }

    if (status === "DONE" && !canEditTaskMetadata(task, auth.actor)) {
      return taskError("Chỉ Trưởng phòng mới duyệt Done.", "ERR_FORBIDDEN", 403);
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "IN_PROGRESS" && !task.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === "REVIEW") {
      updateData.submittedAt = new Date();
    }
    if (status === "DONE") {
      updateData.completedAt = new Date();
    }
    if (status === "PENDING") {
      updateData.pendingReason = reason;
      updateData.pendingBlockType = (body.pendingBlockType as PendingBlockType) || "OTHER";
    }
    if (status === "IN_PROGRESS" && task.status === "PENDING") {
      updateData.pendingReason = null;
      updateData.pendingBlockType = null;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: taskListInclude,
    });

    await recordStatusChange({
      taskId: id,
      fromStatus: task.status,
      toStatus: status,
      actorId: auth.actor.id,
      reason: reason || null,
    });

    if (status === "PENDING" && task.createdById !== auth.actor.id) {
      await createNotification({
        userId: task.createdById,
        type: "TASK_PENDING",
        title: "Task báo vướng mắc",
        body: `Task "${task.title}" đang Pending: ${reason.slice(0, 80)}`,
        payload: { taskId: id, link: `/dashboard/tasks/${id}` },
      });
    }

    return taskSuccess(serializeTask(updated), "Cập nhật trạng thái thành công");
  } catch {
    return taskError("Không thể đổi trạng thái.", "ERR_STATUS_UPDATE", 500);
  }
}
