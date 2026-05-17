import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { buildTaskListWhere } from "@/lib/tasks/query-scope";
import { canCreateTask } from "@/lib/tasks/permissions";
import { taskListInclude, serializeTask } from "@/lib/tasks/serialize";
import { recordStatusChange } from "@/lib/tasks/status-history";
import {
  isValidPriority,
  parseAssigneeIds,
  parseDeadline,
  parseTags,
  parseWeight,
} from "@/lib/tasks/validation";
import { checkAssigneeWeight } from "@/lib/tasks/weight";

export async function GET(request: NextRequest) {
  try {
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where = buildTaskListWhere(auth.actor, {
      status: sp.get("status") ?? undefined,
      assigneeId: sp.get("assigneeId") ?? undefined,
      month: sp.get("month") ?? undefined,
      priority: sp.get("priority") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      departmentId: sp.get("departmentId") ?? undefined,
    });

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { deadline: "asc" }],
        include: taskListInclude,
      }),
    ]);

    return taskSuccess(
      tasks.map(serializeTask),
      "Lấy danh sách task thành công",
      200,
      { pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    );
  } catch {
    return taskError("Không thể lấy danh sách task.", "ERR_FETCH_TASKS", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    if (!canCreateTask(auth.actor)) {
      return taskError("Bạn không có quyền tạo task.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length < 2) {
      return taskError("Tiêu đề phải có ít nhất 2 ký tự.", "ERR_VALIDATION", 400);
    }

    const weight = parseWeight(body.weight);
    if (weight === null) {
      return taskError("Trọng số không hợp lệ.", "ERR_INVALID_WEIGHT", 400);
    }

    const deadline = parseDeadline(body.deadline);
    if (!deadline) {
      return taskError("Deadline không hợp lệ hoặc là ngày quá khứ.", "ERR_INVALID_DEADLINE", 400);
    }

    const assigneeIds = parseAssigneeIds(body.assigneeIds);
    if (!assigneeIds) {
      return taskError("Cần chọn ít nhất một người thực hiện.", "ERR_ASSIGNEES", 400);
    }

    const priority = isValidPriority(body.priority) ? body.priority : "NORMAL";
    const tags = parseTags(body.tags);
    if (tags === null) {
      return taskError(`Tối đa ${5} tag cho mỗi task.`, "ERR_TAGS", 400);
    }

    const departmentId =
      typeof body.departmentId === "string" ? body.departmentId : auth.actor.departmentId;
    if (!departmentId) {
      return taskError("Không xác định được phòng ban.", "ERR_DEPARTMENT", 400);
    }

    const assignees = await prisma.profile.findMany({
      where: { id: { in: assigneeIds }, departmentId, status: "ACTIVE" },
      select: { id: true },
    });
    if (assignees.length !== assigneeIds.length) {
      return taskError("Một hoặc nhiều nhân viên không thuộc phòng ban.", "ERR_ASSIGNEES", 400);
    }

    const urgentOverrideReason =
      typeof body.urgentOverrideReason === "string" ? body.urgentOverrideReason.trim() : null;

    for (const assigneeId of assigneeIds) {
      const check = await checkAssigneeWeight(
        assigneeId,
        weight,
        deadline,
        priority,
        urgentOverrideReason
      );
      if (check.level === "error") {
        return taskError(check.message ?? "Vượt trọng số tháng.", "ERR_WEIGHT_EXCEEDED", 400);
      }
    }

    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        weight,
        deadline,
        priority,
        tags: tags ?? [],
        departmentId,
        createdById: auth.actor.id,
        urgentOverrideReason:
          priority === "URGENT" && urgentOverrideReason ? urgentOverrideReason : null,
        assignees: {
          create: assigneeIds.map((assigneeId) => ({ assigneeId })),
        },
      },
      include: taskListInclude,
    });

    await recordStatusChange({
      taskId: task.id,
      fromStatus: null,
      toStatus: "TO_DO",
      actorId: auth.actor.id,
    });

    for (const assigneeId of assigneeIds) {
      if (assigneeId !== auth.actor.id) {
        await createNotification({
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          title: "Task mới được giao",
          body: `Bạn được giao task: ${title}`,
          payload: { taskId: task.id, link: `/dashboard/tasks/${task.id}` },
        });
      }
    }

    return taskSuccess(serializeTask(task), "Tạo task thành công", 201);
  } catch {
    return taskError("Không thể tạo task.", "ERR_CREATE_TASK", 500);
  }
}
