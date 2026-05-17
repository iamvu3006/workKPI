import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { calculateKpiFromTasks } from "./calculator";
import { scoreToGrade } from "./grades";
import { monthBounds } from "./month-range";

export async function calculateAndSaveKpiForUsers(
  userIds: string[],
  month: number,
  year: number,
  calculatedById: string | null
): Promise<{ processed: number; results: { userId: string; totalScore: number; grade: string }[] }> {
  const { start, end } = monthBounds(month, year);
  const results: { userId: string; totalScore: number; grade: string }[] = [];

  for (const userId of userIds) {
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        status: "DONE",
        completedAt: { gte: start, lte: end },
        assignees: { some: { assigneeId: userId } },
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

    const calc = calculateKpiFromTasks(tasks);
    const grade = scoreToGrade(calc.totalScore);

    await prisma.kpiRecord.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      create: {
        userId,
        month,
        year,
        totalScore: calc.totalScore,
        grade,
        taskBreakdown: calc.taskBreakdown as unknown as Prisma.InputJsonValue,
        onTimeRate: calc.onTimeRate,
        calculatedById,
      },
      update: {
        totalScore: calc.totalScore,
        grade,
        taskBreakdown: calc.taskBreakdown as unknown as Prisma.InputJsonValue,
        onTimeRate: calc.onTimeRate,
        calculatedAt: new Date(),
        calculatedById,
      },
    });

    results.push({ userId, totalScore: calc.totalScore, grade });
  }

  return { processed: results.length, results };
}
