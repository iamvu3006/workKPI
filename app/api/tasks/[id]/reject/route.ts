import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { MIN_REJECT_REASON_LENGTH } from "@/lib/tasks/constants";
import { isAssignee } from "@/lib/tasks/permissions";
import { taskListInclude, serializeTask } from "@/lib/tasks/serialize";
import { recordStatusChange } from "@/lib/tasks/status-history";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const body = await request.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < MIN_REJECT_REASON_LENGTH) {
      return taskError(`Lý do từ chối cần ít nhất ${MIN_REJECT_REASON_LENGTH} ký tự.`, "ERR_REASON", 400);
    }

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignees: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);

    if (!isAssignee(task, auth.actor.id)) {
      return taskError("Chỉ assignee mới có thể từ chối task.", "ERR_FORBIDDEN", 403);
    }

    if (!["TO_DO", "IN_PROGRESS"].includes(task.status)) {
      return taskError("Không thể từ chối ở trạng thái hiện tại.", "ERR_STATUS", 400);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "TO_DO",
        rejectReason: reason,
        progressPercent: 0,
        startedAt: null,
      },
      include: taskListInclude,
    });

    await recordStatusChange({
      taskId: id,
      fromStatus: task.status,
      toStatus: "TO_DO",
      actorId: auth.actor.id,
      reason,
      metadata: { action: "reject" },
    });

    await createNotification({
      userId: task.createdById,
      type: "TASK_REJECTED",
      title: "Task bị từ chối",
      body: `${reason.slice(0, 100)}`,
      payload: { taskId: id, link: `/dashboard/tasks/${id}` },
    });

    return taskSuccess(serializeTask(updated), "Đã từ chối task");
  } catch {
    return taskError("Không thể từ chối task.", "ERR_REJECT", 500);
  }
}
