import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { syncTaskProgressFromChecklist } from "@/lib/tasks/checklist";
import { canViewTask } from "@/lib/tasks/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignees: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canViewTask(task, auth.actor)) {
      return taskError("Không có quyền.", "ERR_FORBIDDEN", 403);
    }

    const items = await prisma.taskChecklistItem.findMany({
      where: { taskId: id },
      orderBy: { sortOrder: "asc" },
    });

    return taskSuccess(items);
  } catch {
    return taskError("Không thể lấy checklist.", "ERR_CHECKLIST", 500);
  }
}

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
    if (!canViewTask(task, auth.actor)) {
      return taskError("Không có quyền.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const items: string[] = Array.isArray(body.items)
      ? body.items.filter((t: unknown) => typeof t === "string" && t.trim()).map((t: string) => t.trim())
      : typeof body.title === "string"
        ? [body.title.trim()]
        : [];

    if (items.length === 0) {
      return taskError("Cần ít nhất một mục checklist.", "ERR_VALIDATION", 400);
    }

    const existingCount = await prisma.taskChecklistItem.count({ where: { taskId } });

    const created = await prisma.$transaction(
      items.map((title, i) =>
        prisma.taskChecklistItem.create({
          data: { taskId, title, sortOrder: existingCount + i },
        })
      )
    );

    await syncTaskProgressFromChecklist(taskId);

    return taskSuccess(created, "Thêm checklist thành công", 201);
  } catch {
    return taskError("Không thể thêm checklist.", "ERR_CHECKLIST", 500);
  }
}
