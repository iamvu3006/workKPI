import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { canViewTask } from "@/lib/tasks/permissions";
import { serializeTask, taskListInclude } from "@/lib/tasks/serialize";
import { recordStatusChange } from "@/lib/tasks/status-history";
import { parseDeadline } from "@/lib/tasks/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function syncParentProgress(parentTaskId: string) {
  const subtasks = await prisma.task.findMany({
    where: { parentTaskId, deletedAt: null },
    select: { progressPercent: true },
  });
  if (subtasks.length === 0) return;
  const avg = Math.round(
    subtasks.reduce((s, t) => s + t.progressPercent, 0) / subtasks.length
  );
  await prisma.task.update({
    where: { id: parentTaskId },
    data: { progressPercent: avg },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: parentId } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const parent = await prisma.task.findFirst({
      where: { id: parentId, deletedAt: null },
      include: { assignees: true },
    });
    if (!parent) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canViewTask(parent, auth.actor)) {
      return taskError("Không có quyền.", "ERR_FORBIDDEN", 403);
    }

    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: parentId, deletedAt: null },
      include: taskListInclude,
      orderBy: { createdAt: "asc" },
    });

    return taskSuccess(subtasks.map(serializeTask));
  } catch {
    return taskError("Không thể lấy sub-task.", "ERR_SUBTASKS", 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: parentId } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const parent = await prisma.task.findFirst({
      where: { id: parentId, deletedAt: null, parentTaskId: null },
      include: { assignees: true },
    });
    if (!parent) return taskError("Task cha không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canViewTask(parent, auth.actor)) {
      return taskError("Không có quyền.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length < 2) return taskError("Tiêu đề quá ngắn.", "ERR_VALIDATION", 400);

    const assigneeId = typeof body.assigneeId === "string" ? body.assigneeId : null;
    if (!assigneeId) return taskError("Cần chọn assignee.", "ERR_ASSIGNEE", 400);

    const assignee = await prisma.profile.findFirst({
      where: { id: assigneeId, departmentId: parent.departmentId, status: "ACTIVE" },
    });
    if (!assignee) return taskError("Assignee không hợp lệ.", "ERR_ASSIGNEE", 400);

    const deadline = parseDeadline(body.deadline) ?? parent.deadline;

    const subtask = await prisma.task.create({
      data: {
        title,
        description: null,
        weight: 0,
        deadline,
        priority: parent.priority,
        departmentId: parent.departmentId,
        createdById: auth.actor.id,
        parentTaskId: parentId,
        assignees: { create: [{ assigneeId }] },
      },
      include: taskListInclude,
    });

    await recordStatusChange({
      taskId: subtask.id,
      fromStatus: null,
      toStatus: "TO_DO",
      actorId: auth.actor.id,
    });

    await syncParentProgress(parentId);

    if (assigneeId !== auth.actor.id) {
      // notification handled at parent level in full impl
    }

    return taskSuccess(serializeTask(subtask), "Tạo sub-task thành công", 201);
  } catch {
    return taskError("Không thể tạo sub-task.", "ERR_CREATE_SUBTASK", 500);
  }
}
