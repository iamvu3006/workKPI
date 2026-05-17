import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { canCalculateKpi, getKpiActor } from "@/lib/kpi/auth";
import { parseMonthYear } from "@/lib/kpi/month-range";
import { calculateAndSaveKpiForUsers } from "@/lib/kpi/persist";
import { createNotification } from "@/lib/notifications";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

export async function POST(request: NextRequest) {
  try {
    const auth = await getKpiActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    if (!canCalculateKpi(auth.actor)) {
      return taskError("Không có quyền tính KPI.", "ERR_FORBIDDEN", 403);
    }

    const body = await request.json();
    const parsed = parseMonthYear(
      body.month != null ? String(body.month) : null,
      body.year != null ? String(body.year) : null
    );
    if ("error" in parsed) return taskError(parsed.error, "ERR_PARAMS", 400);

    const { month, year } = parsed;
    let departmentId =
      typeof body.departmentId === "string" ? body.departmentId : auth.actor.departmentId;

    if (auth.actor.role === "MANAGER") {
      if (!auth.actor.departmentId) {
        return taskError("Trưởng phòng chưa được gán phòng ban.", "ERR_DEPT", 400);
      }
      departmentId = auth.actor.departmentId;
    }

    const where: { departmentId?: string; status: "ACTIVE"; role?: { not: "ADMIN" } } = {
      status: "ACTIVE",
      role: { not: "ADMIN" },
    };
    if (departmentId) where.departmentId = departmentId;

    const profiles = await prisma.profile.findMany({
      where,
      select: { id: true },
    });

    const userIds = profiles.map((p) => p.id);
    const { processed, results } = await calculateAndSaveKpiForUsers(
      userIds,
      month,
      year,
      auth.actor.id
    );

    for (const r of results) {
      await createNotification({
        userId: r.userId,
        type: "KPI_PUBLISHED",
        title: "KPI tháng đã được công bố",
        body: `KPI tháng ${month}/${year}: ${r.totalScore} điểm (${r.grade}).`,
        payload: { link: "/dashboard/kpi", month, year },
      });
    }

    return taskSuccess({ processed, results, month, year }, "Tính KPI thành công");
  } catch {
    return taskError("Không thể tính KPI.", "ERR_KPI_CALCULATE", 500);
  }
}
