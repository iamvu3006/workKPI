import { NextRequest } from "next/server";

import { applyOverduePenalty } from "@/lib/kpi/overdue-penalty";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const score = Number(searchParams.get("score"));
    const deadline = searchParams.get("deadline");

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return taskError("Score phải từ 0 đến 100", "ERR_SCORE", 400);
    }

    if (!deadline) {
      return taskError("Thiếu deadline", "ERR_DEADLINE", 400);
    }

    const deadlineDate = new Date(deadline);
    const approvedAt = new Date();

    const penalty = applyOverduePenalty(score, deadlineDate, approvedAt);

    return taskSuccess(penalty, "OK");
  } catch {
    return taskError("Lỗi tính toán", "ERR_CALC", 500);
  }
}
