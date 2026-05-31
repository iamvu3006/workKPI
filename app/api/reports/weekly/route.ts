import { NextResponse } from "next/server";
import { getProgressReport } from "@/lib/reports";
import { getKpiActor } from "@/lib/kpi/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const periodParam = params.get("period");
    const period = periodParam === "month" || periodParam === "quarter" || periodParam === "year" ? periodParam : "week";
      const weekStart = params.get("weekStart") ?? undefined; // ISO date for Monday
    const month = params.get("month") ? Number(params.get("month")) : undefined;
    const year = params.get("year") ? Number(params.get("year")) : undefined;

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (auth.actor.role === "EMPLOYEE") {
      const report = await getProgressReport({
        period,
        weekStart,
        month,
        year,
        departmentId: auth.actor.departmentId,
        assigneeId: auth.actor.id,
      });
      return NextResponse.json({ success: true, data: report, message: "Thành công" });
    }

    if (auth.actor.role === "LEADER") {
      if (!auth.actor.teamId) {
        return NextResponse.json({ success: false, error: "LEADER chưa được gán team." }, { status: 403 });
      }

      const report = await getProgressReport({
        period,
        weekStart,
        month,
        year,
        departmentId: auth.actor.departmentId,
        teamId: auth.actor.teamId,
      });
      return NextResponse.json({ success: true, data: report, message: "Thành công" });
    }

    if (auth.actor.role === "MANAGER" || auth.actor.role === "DIRECTOR" || auth.actor.role === "ADMIN") {
      return NextResponse.json({ success: false, error: "Vai trò này dùng báo cáo phòng ban hoặc toàn công ty." }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: "Không có quyền xem báo cáo này." }, { status: 403 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 500 });
  }
}
