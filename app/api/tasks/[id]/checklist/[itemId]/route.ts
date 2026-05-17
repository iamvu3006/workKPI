import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { syncTaskProgressFromChecklist } from "@/lib/tasks/checklist";
import { canViewTask } from "@/lib/tasks/permissions";

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

async function authorize(taskId: string) {
  const auth = await getTaskActor();
  if ("error" in auth) return { error: taskError(auth.error, "ERR_UNAUTHORIZED", auth.status) };

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: { assignees: true },
  });
  if (!task) return { error: taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404) };
  if (!canViewTask(task, auth.actor)) {
    return { error: taskError("Không có quyền.", "ERR_FORBIDDEN", 403) };
  }
  return { taskId };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId, itemId } = await context.params;
    const authResult = await authorize(taskId);
    if ("error" in authResult && authResult.error) return authResult.error;

    const body = await request.json();
    const item = await prisma.taskChecklistItem.update({
      where: { id: itemId, taskId },
      data: {
        ...(typeof body.isDone === "boolean" ? { isDone: body.isDone } : {}),
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
      },
    });

    await syncTaskProgressFromChecklist(taskId);
    return taskSuccess(item);
  } catch {
    return taskError("Không thể cập nhật checklist.", "ERR_CHECKLIST", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId, itemId } = await context.params;
    const authResult = await authorize(taskId);
    if ("error" in authResult && authResult.error) return authResult.error;

    await prisma.taskChecklistItem.delete({ where: { id: itemId, taskId } });
    await syncTaskProgressFromChecklist(taskId);
    return taskSuccess(null, "Đã xóa mục checklist");
  } catch {
    return taskError("Không thể xóa checklist.", "ERR_CHECKLIST", 500);
  }
}
