import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getKpiActor } from "@/lib/kpi/auth";
import { GRADE_LABELS } from "@/lib/kpi/grades";
import { parseMonthYear } from "@/lib/kpi/month-range";
import { normalizeTaskBreakdown } from "@/lib/kpi/task-breakdown";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await getKpiActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const parsed = parseMonthYear(
      request.nextUrl.searchParams.get("month"),
      request.nextUrl.searchParams.get("year")
    );
    if ("error" in parsed) return taskError(parsed.error, "ERR_PARAMS", 400);

    const { month, year } = parsed;

    const record = await prisma.kpiRecord.findUnique({
      where: {
        userId_month_year: {
          userId: auth.actor.id,
          month,
          year,
        },
      },
    });

    const history = await prisma.kpiRecord.findMany({
      where: { userId: auth.actor.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
      select: { month: true, year: true, totalScore: true, grade: true },
    });

    if (!record) {
      return taskSuccess({
        month,
        year,
        totalScore: null,
        grade: null,
        gradeLabel: null,
        taskBreakdown: [],
        onTimeRate: null,
        calculatedAt: null,
        history: history.map((h) => ({
          ...h,
          gradeLabel: GRADE_LABELS[h.grade],
        })),
      });
    }

    return taskSuccess({
      userId: record.userId,
      month: record.month,
      year: record.year,
      totalScore: record.totalScore,
      grade: record.grade,
      gradeLabel: GRADE_LABELS[record.grade],
      taskBreakdown: normalizeTaskBreakdown(record.taskBreakdown),
      onTimeRate: record.onTimeRate,
      calculatedAt: record.calculatedAt,
      history: history.map((h) => ({
        month: h.month,
        year: h.year,
        totalScore: h.totalScore,
        grade: h.grade,
        gradeLabel: GRADE_LABELS[h.grade],
      })),
    });
  } catch {
    return taskError("Không thể tải KPI.", "ERR_KPI_ME", 500);
  }
}
