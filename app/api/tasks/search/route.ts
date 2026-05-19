import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { taskListInclude, serializeTask } from "@/lib/tasks/serialize";

import type { Prisma } from "@prisma/client";

function buildRoleScope(actor: { id: string; role: string; departmentId: string | null; teamId: string | null }): Prisma.TaskWhereInput {
  if (actor.role === "DIRECTOR" || actor.role === "ADMIN") {
    return {};
  }

  if (actor.role === "MANAGER") {
    return { departmentId: actor.departmentId ?? "__none__" };
  }

  if (actor.role === "LEADER") {
    if (!actor.teamId) return { id: "__none__" };

    return {
      assignees: {
        some: {
          assignee: {
            teamId: actor.teamId,
          },
        },
      },
    };
  }

  return {
    assignees: {
      some: {
        assigneeId: actor.id,
      },
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const params = request.nextUrl.searchParams;
    const q = (params.get("q") ?? "").trim();

    if (q.length < 3) {
      return taskSuccess({ data: [], total: 0 }, "Nhập tối thiểu 3 ký tự để tìm kiếm.");
    }

    const limit = Math.min(50, Math.max(1, Number(params.get("limit") ?? "20")));
    const status = params.get("status") ?? undefined;
    const priority = params.get("priority") ?? undefined;
    const assigneeId = params.get("assigneeId") ?? undefined;
    const tag = params.get("tag") ?? undefined;
    const deadlineFrom = params.get("from");
    const deadlineTo = params.get("to");

    const andClauses: Prisma.TaskWhereInput[] = [
      { deletedAt: null, parentTaskId: null },
      buildRoleScope(auth.actor),
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
    ];

    if (status) {
      andClauses.push({ status: status as Prisma.EnumTaskStatusFilter });
    }

    if (priority) {
      andClauses.push({ priority: priority as Prisma.EnumTaskPriorityFilter });
    }

    if (assigneeId) {
      andClauses.push({ assignees: { some: { assigneeId } } });
    }

    if (tag) {
      andClauses.push({ tags: { has: tag } });
    }

    if (deadlineFrom || deadlineTo) {
      andClauses.push({
        deadline: {
          ...(deadlineFrom ? { gte: new Date(`${deadlineFrom}T00:00:00.000Z`) } : {}),
          ...(deadlineTo ? { lte: new Date(`${deadlineTo}T23:59:59.999Z`) } : {}),
        },
      });
    }

    const where: Prisma.TaskWhereInput = { AND: andClauses };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { deadline: "asc" }],
        include: taskListInclude,
      }),
    ]);

    return taskSuccess(
      { data: tasks.map(serializeTask), total },
      "Tìm kiếm task thành công"
    );
  } catch {
    return taskError("Không thể tìm kiếm task.", "ERR_TASK_SEARCH", 500);
  }
}
