import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import {
  canEditTaskMetadata,
  canSoftDeleteTask,
  canViewTask,
} from "@/lib/tasks/permissions";
import { taskDetailInclude, taskListInclude, serializeTask } from "@/lib/tasks/serialize";
import {
  isValidPriority,
  parseDeadline,
  parseTags,
  parseWeight,
} from "@/lib/tasks/validation";
import { checkAssigneeWeight } from "@/lib/tasks/weight";

type RouteContext = { params: Promise<{ id: string }> };

async function loadTask(id: string) {
  return prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: taskDetailInclude,
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await loadTask(id);
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canViewTask(task, auth.actor)) {
      return taskError("Không có quyền xem task.", "ERR_FORBIDDEN", 403);
    }

    return taskSuccess(serializeTask(task));
  } catch {
    return taskError("Không thể lấy task.", "ERR_FETCH_TASK", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
      return taskError("Không có quyền chỉnh sửa task.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (title.length < 2) return taskError("Tiêu đề quá ngắn.", "ERR_VALIDATION", 400);
      data.title = title;
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim() || null;
    }
    if (body.priority !== undefined) {
      if (!isValidPriority(body.priority)) {
        return taskError("Mức ưu tiên không hợp lệ.", "ERR_PRIORITY", 400);
      }
      data.priority = body.priority;
    }
    if (body.weight !== undefined) {
      const weight = parseWeight(body.weight);
      if (weight === null) return taskError("Trọng số không hợp lệ.", "ERR_WEIGHT", 400);
      data.weight = weight;
    }
    if (body.deadline !== undefined) {
      const deadline = parseDeadline(body.deadline);
      if (!deadline) return taskError("Deadline không hợp lệ.", "ERR_DEADLINE", 400);
      data.deadline = deadline;
    }
    if (body.tags !== undefined) {
      const tags = parseTags(body.tags);
      if (tags === null) return taskError("Quá nhiều tag.", "ERR_TAGS", 400);
      data.tags = tags;
    }

    const nextWeight = (data.weight as number) ?? task.weight;
    const nextDeadline = (data.deadline as Date) ?? task.deadline;
    const nextPriority = (data.priority as typeof task.priority) ?? task.priority;

    if (body.weight !== undefined || body.deadline !== undefined) {
      for (const a of task.assignees) {
        const check = await checkAssigneeWeight(
          a.assigneeId,
          nextWeight,
          nextDeadline,
          nextPriority,
          task.urgentOverrideReason,
          task.id
        );
        if (check.level === "error") {
          return taskError(check.message ?? "Vượt trọng số.", "ERR_WEIGHT", 400);
        }
      }
    }

    if (Array.isArray(body.assigneeIds)) {
      const assigneeIds = body.assigneeIds.filter((x: unknown) => typeof x === "string");
      const profiles = await prisma.profile.findMany({
        where: { id: { in: assigneeIds }, departmentId: task.departmentId, status: "ACTIVE" },
      });
      if (profiles.length !== assigneeIds.length) {
        return taskError("Assignee không hợp lệ.", "ERR_ASSIGNEES", 400);
      }
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map((assigneeId: string) => ({ taskId: id, assigneeId })),
      });
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: taskListInclude,
    });

    return taskSuccess(serializeTask(updated), "Cập nhật task thành công");
  } catch {
    return taskError("Không thể cập nhật task.", "ERR_UPDATE_TASK", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canSoftDeleteTask(task, auth.actor)) {
      return taskError("Chỉ Trưởng phòng mới có thể xóa task.", "ERR_FORBIDDEN", 403);
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return taskSuccess(null, "Đã xóa task", 200);
  } catch {
    return taskError("Không thể xóa task.", "ERR_DELETE_TASK", 500);
  }
}
