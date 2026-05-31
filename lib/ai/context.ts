import { prisma } from "@/lib/db/prisma";

import type { Prisma, UserRole } from "@prisma/client";

import type { AiActor } from "./auth";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  DIRECTOR: "Giám đốc",
  MANAGER: "Trưởng phòng",
  LEADER: "Trưởng nhóm",
  EMPLOYEE: "Nhân viên",
};

type GeminiContext = {
  systemInstruction: string;
  scope: string;
  taskSummary: string;
  kpiSummary: string;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "không rõ";
  return value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTaskLine(task: {
  title: string;
  status: string;
  priority: string;
  deadline: Date;
  progressPercent: number;
  weight: number;
  departmentId: string;
  assigneeCount: number;
}) {
  return [
    task.title,
    `trạng thái: ${task.status}`,
    `ưu tiên: ${task.priority}`,
    `hạn: ${formatDate(task.deadline)}`,
    `tiến độ: ${task.progressPercent}%`,
    `trọng số: ${task.weight}`,
    `phòng ban: ${task.departmentId}`,
    `người được giao: ${task.assigneeCount}`,
  ].join(" | ");
}

function buildTaskWhere(actor: AiActor): Prisma.TaskWhereInput {
  if (actor.role === "ADMIN" || actor.role === "DIRECTOR") {
    return { deletedAt: null };
  }

  if (actor.role === "MANAGER") {
    return {
      deletedAt: null,
      departmentId: actor.departmentId ?? "__none__",
    };
  }

  if (actor.role === "LEADER") {
    if (!actor.teamId) {
      return { id: "__none__" };
    }

    return {
      deletedAt: null,
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
    deletedAt: null,
    assignees: {
      some: {
        assigneeId: actor.id,
      },
    },
  };
}

function buildKpiWhere(actor: AiActor) {
  if (actor.role === "ADMIN" || actor.role === "DIRECTOR") {
    return {};
  }

  if (actor.role === "MANAGER") {
    return {
      status: "ACTIVE" as const,
      departmentId: actor.departmentId ?? "__none__",
    };
  }

  if (actor.role === "LEADER") {
    return {
      status: "ACTIVE" as const,
      teamId: actor.teamId ?? "__none__",
    };
  }

  return {
    id: actor.id,
  };
}

function buildScopeText(actor: AiActor) {
  const roleLabel = ROLE_LABELS[actor.role];
  const departmentText = actor.department ? `${actor.department.name} (${actor.department.code})` : "không có phòng ban";
  const teamText = actor.team ? actor.team.name : "không có nhóm";

  if (actor.role === "ADMIN" || actor.role === "DIRECTOR") {
    return `${roleLabel}: phạm vi toàn công ty.`;
  }

  if (actor.role === "MANAGER") {
    return `${roleLabel}: phạm vi phòng ban ${departmentText}.`;
  }

  if (actor.role === "LEADER") {
    return `${roleLabel}: phạm vi nhóm ${teamText} trong phòng ban ${departmentText}.`;
  }

  return `${roleLabel}: phạm vi cá nhân của người dùng.`;
}

export async function buildAiContext(actor: AiActor): Promise<GeminiContext> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const taskWhere = buildTaskWhere(actor);
  const kpiWhere = buildKpiWhere(actor);

  const [
    totalTasks,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    reviewTasks,
    doneTasks,
    overdueTasks,
    recentTasks,
    kpiAggregate,
    kpiRecords,
  ] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: "TO_DO" } }),
    prisma.task.count({ where: { ...taskWhere, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { ...taskWhere, status: "PENDING" } }),
    prisma.task.count({ where: { ...taskWhere, status: "REVIEW" } }),
    prisma.task.count({ where: { ...taskWhere, status: "DONE" } }),
    prisma.task.count({
      where: {
        ...taskWhere,
        deadline: { lt: startOfDay },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.task.findMany({
      where: taskWhere,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        title: true,
        status: true,
        priority: true,
        deadline: true,
        progressPercent: true,
        weight: true,
        departmentId: true,
        _count: {
          select: { assignees: true },
        },
      },
    }),
    prisma.kpiRecord.aggregate({
      where:
        actor.role === "ADMIN" || actor.role === "DIRECTOR"
          ? { month, year }
          : {
              month,
              year,
              user: kpiWhere as Prisma.ProfileWhereInput,
            },
      _count: { _all: true },
      _avg: { totalScore: true, onTimeRate: true },
    }),
    actor.role === "ADMIN" || actor.role === "DIRECTOR"
      ? prisma.kpiRecord.findMany({
          where: { month, year },
          orderBy: [{ totalScore: "desc" }, { calculatedAt: "desc" }],
          take: 5,
          select: {
            month: true,
            year: true,
            totalScore: true,
            grade: true,
            onTimeRate: true,
            user: {
              select: {
                fullName: true,
                displayName: true,
                email: true,
                department: { select: { name: true } },
              },
            },
          },
        })
      : actor.role === "EMPLOYEE"
        ? prisma.kpiRecord.findMany({
            where: { userId: actor.id },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            take: 3,
            select: { month: true, year: true, totalScore: true, grade: true, onTimeRate: true },
          })
        : prisma.profile.findMany({
            where: kpiWhere as Prisma.ProfileWhereInput,
            select: {
              id: true,
              fullName: true,
              displayName: true,
              email: true,
              department: { select: { name: true } },
            },
          }).then(async (profiles) => {
            if (profiles.length === 0) return [];

            const records = await prisma.kpiRecord.findMany({
              where: {
                month,
                year,
                userId: { in: profiles.map((profile) => profile.id) },
              },
              orderBy: [{ totalScore: "desc" }, { calculatedAt: "desc" }],
              take: 5,
              select: {
                userId: true,
                month: true,
                year: true,
                totalScore: true,
                grade: true,
                onTimeRate: true,
              },
            });

            const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

            return records.map((record) => {
              const profile = profileMap.get(record.userId);
              return {
                ...record,
                name: profile?.displayName || profile?.fullName || profile?.email || record.userId,
                departmentName: profile?.department?.name ?? null,
              };
            });
          }),
  ]);

  const taskSummary = [
    `tổng task: ${totalTasks}`,
    `cần làm: ${todoTasks}`,
    `đang làm: ${inProgressTasks}`,
    `tạm dừng: ${pendingTasks}`,
    `chờ duyệt: ${reviewTasks}`,
    `hoàn thành: ${doneTasks}`,
    `quá hạn: ${overdueTasks}`,
  ].join("; ");

  const recentTaskText = recentTasks.length
    ? recentTasks.map((task) => `- ${formatTaskLine({ ...task, assigneeCount: task._count.assignees })}`).join("\n")
    : "- Không có task phù hợp trong phạm vi được cấp.";

  const kpiSummaryText =
    actor.role === "EMPLOYEE"
      ? kpiRecords.length > 0
        ? kpiRecords
            .map(
              (record) =>
                `- KPI ${record.month}/${record.year}: ${record.totalScore ?? "chưa tính"} điểm, ${record.grade}, on-time ${record.onTimeRate ?? "-"}%`
            )
            .join("\n")
        : "- Chưa có KPI cá nhân trong phạm vi hiện tại."
      : kpiRecords.length > 0
        ? kpiRecords
            .map((record: any) => {
              const name = record.name || record.user?.displayName || record.user?.fullName || record.user?.email || record.userId;
              const departmentName = record.departmentName || record.user?.department?.name || "không rõ";
              return `- ${name} (${departmentName}): ${record.totalScore ?? "chưa tính"} điểm, ${record.grade}, on-time ${record.onTimeRate ?? "-"}%`;
            })
            .join("\n")
        : "- Chưa có KPI phù hợp trong phạm vi hiện tại.";

  const scopeText = buildScopeText(actor);
  const systemInstruction = [
    "Bạn là trợ lý AI nội bộ của WorkKPI.",
    "Luôn trả lời bằng tiếng Việt, ngắn gọn, chính xác, và ưu tiên gạch đầu dòng khi có nhiều ý.",
    "Chỉ sử dụng dữ liệu trong ngữ cảnh được cấp. Không bịa thêm thông tin, không tiết lộ dữ liệu ngoài phạm vi.",
    "Nếu dữ liệu không đủ để trả lời, hãy nói rõ là chưa đủ thông tin.",
    `Người dùng hiện tại: ${actor.displayName || actor.fullName || actor.email} (${ROLE_LABELS[actor.role]})`,
    `Phạm vi được phép: ${scopeText}`,
    `Phòng ban: ${actor.department ? `${actor.department.name} (${actor.department.code})` : "không có"}`,
    `Nhóm: ${actor.team ? actor.team.name : "không có"}`,
    `Thống kê công việc: ${taskSummary}`,
    `Công việc gần đây:\n${recentTaskText}`,
    `KPI gần đây:\n${kpiSummaryText}`,
    `Tổng số bản ghi KPI trong phạm vi: ${kpiAggregate._count._all}`,
    `Điểm KPI trung bình: ${kpiAggregate._avg.totalScore ?? "chưa có"}`,
    `Tỷ lệ đúng hạn trung bình: ${kpiAggregate._avg.onTimeRate ?? "chưa có"}`,
  ].join("\n");

  return {
    systemInstruction,
    scope: scopeText,
    taskSummary,
    kpiSummary: kpiSummaryText,
  };
}