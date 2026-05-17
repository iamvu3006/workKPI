import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { MIN_EXTEND_REASON_LENGTH } from "@/lib/tasks/constants";
import { isAssignee } from "@/lib/tasks/permissions";
import { parseDeadline } from "@/lib/tasks/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { assignees: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);

    if (!isAssignee(task, auth.actor.id)) {
      return taskError("Chỉ assignee mới yêu cầu gia hạn.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < MIN_EXTEND_REASON_LENGTH) {
      return taskError(`Lý do cần ít nhất ${MIN_EXTEND_REASON_LENGTH} ký tự.`, "ERR_REASON", 400);
    }

    const proposedDeadline = parseDeadline(body.proposedDeadline);
    if (!proposedDeadline) {
      return taskError("Ngày đề xuất không hợp lệ.", "ERR_DEADLINE", 400);
    }

    const extendRequest = await prisma.taskExtendRequest.create({
      data: {
        taskId,
        requestedById: auth.actor.id,
        proposedDeadline,
        reason,
      },
    });

    const dept = await prisma.department.findUnique({
      where: { id: task.departmentId },
      select: { managerId: true },
    });

    if (dept?.managerId) {
      await createNotification({
        userId: dept.managerId,
        type: "TASK_EXTEND_REQUEST",
        title: "Yêu cầu gia hạn deadline",
        body: `Task "${task.title}": ${reason.slice(0, 80)}`,
        payload: {
          taskId,
          extendRequestId: extendRequest.id,
          link: `/dashboard/tasks/${taskId}`,
        },
      });
    }

    return taskSuccess(extendRequest, "Đã gửi yêu cầu gia hạn", 201);
  } catch {
    return taskError("Không thể gửi yêu cầu gia hạn.", "ERR_EXTEND", 500);
  }
}
