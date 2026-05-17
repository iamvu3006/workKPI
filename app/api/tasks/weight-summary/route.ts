import { NextRequest } from "next/server";

import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { WEIGHT_MAX_PERCENT, WEIGHT_WARN_PERCENT } from "@/lib/tasks/constants";
import { getAssigneeMonthlyWeight } from "@/lib/tasks/weight";

export async function GET(request: NextRequest) {
  try {
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const sp = request.nextUrl.searchParams;
    const assigneeId = sp.get("assigneeId") || auth.actor.id;
    const now = new Date();
    const year = parseInt(sp.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(sp.get("month") || String(now.getMonth() + 1), 10);

    if (auth.actor.role === "EMPLOYEE" && assigneeId !== auth.actor.id) {
      return taskError("Không có quyền xem workload người khác.", "ERR_FORBIDDEN", 403);
    }

    const total = await getAssigneeMonthlyWeight(assigneeId, year, month);
    const level =
      total > WEIGHT_MAX_PERCENT ? "error" : total > WEIGHT_WARN_PERCENT ? "warn" : "ok";

    return taskSuccess({
      assigneeId,
      year,
      month,
      total,
      max: WEIGHT_MAX_PERCENT,
      warnAt: WEIGHT_WARN_PERCENT,
      level,
    });
  } catch {
    return taskError("Không thể tính trọng số tháng.", "ERR_WEIGHT_SUMMARY", 500);
  }
}
