import { prisma } from "@/lib/db/prisma";
import { calculateKpiEstimate } from "@/lib/kpi/calculator";
import { getKpiActor } from "@/lib/kpi/auth";
import { monthBounds } from "@/lib/kpi/month-range";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

export async function GET() {
  try {
    const auth = await getKpiActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { start, end } = monthBounds(month, year);

    const assigneeFilter = { assignees: { some: { assigneeId: auth.actor.id } } };

    const doneTasks = await prisma.task.findMany({
      where: {
        ...assigneeFilter,
        deletedAt: null,
        status: "DONE",
        completedAt: { gte: start, lte: end },
        qualityScore: { not: null },
      },
      select: {
        id: true,
        title: true,
        weight: true,
        progressPercent: true,
        qualityScore: true,
        penaltyDays: true,
        deadline: true,
        completedAt: true,
        submittedAt: true,
      },
    });

    const inProgressTasks = await prisma.task.findMany({
      where: {
        ...assigneeFilter,
        deletedAt: null,
        status: { in: ["IN_PROGRESS", "REVIEW", "PENDING"] },
        createdAt: { lte: end },
      },
      select: {
        id: true,
        title: true,
        weight: true,
        progressPercent: true,
      },
    });

    const estimate = calculateKpiEstimate(doneTasks, inProgressTasks);

    return taskSuccess({
      estimatedScore: estimate.totalScore,
      isEstimate: true,
      month,
      year,
      tasks: estimate.taskBreakdown,
      onTimeRate: estimate.onTimeRate,
    });
  } catch {
    return taskError("Không thể ước tính KPI.", "ERR_KPI_ESTIMATE", 500);
  }
}
