import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { canViewDepartmentKpi, getKpiActor } from "@/lib/kpi/auth";
import { GRADE_LABELS } from "@/lib/kpi/grades";
import { parseMonthYear } from "@/lib/kpi/month-range";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await getKpiActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    if (!canViewDepartmentKpi(auth.actor)) {
      return taskError("Không có quyền xem KPI phòng ban.", "ERR_FORBIDDEN", 403);
    }

    const parsed = parseMonthYear(
      request.nextUrl.searchParams.get("month"),
      request.nextUrl.searchParams.get("year")
    );
    if ("error" in parsed) return taskError(parsed.error, "ERR_PARAMS", 400);

    let departmentId = request.nextUrl.searchParams.get("departmentId");
    if (auth.actor.role === "MANAGER") {
      departmentId = auth.actor.departmentId;
    }
    if (!departmentId) {
      return taskError("Thiếu phòng ban.", "ERR_DEPT", 400);
    }

    const members = await prisma.profile.findMany({
      where: {
        departmentId,
        status: "ACTIVE",
        role: { in: ["EMPLOYEE", "LEADER", "MANAGER"] },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const records = await prisma.kpiRecord.findMany({
      where: {
        userId: { in: members.map((m) => m.id) },
        month: parsed.month,
        year: parsed.year,
      },
    });

    const byUser = new Map(records.map((r) => [r.userId, r]));

    const ranked = members
      .map((m) => {
        const rec = byUser.get(m.id);
        return {
          userId: m.id,
          name: m.displayName || m.fullName || m.email,
          avatarUrl: m.avatarUrl,
          totalScore: rec?.totalScore ?? null,
          grade: rec?.grade ?? null,
          gradeLabel: rec ? GRADE_LABELS[rec.grade] : "Chưa tính",
          onTimeRate: rec?.onTimeRate ?? null,
        };
      })
      .sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1))
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const withScores = ranked.filter((r) => r.totalScore != null);
    const avgKpi =
      withScores.length > 0
        ? Math.round(
            (withScores.reduce((s, r) => s + (r.totalScore ?? 0), 0) / withScores.length) * 100
          ) / 100
        : null;

    return taskSuccess({
      departmentId,
      month: parsed.month,
      year: parsed.year,
      avgKpi,
      members: ranked,
    });
  } catch {
    return taskError("Không thể tải KPI phòng ban.", "ERR_KPI_DEPT", 500);
  }
}
