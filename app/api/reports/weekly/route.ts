import { NextResponse } from "next/server";
import { getWeeklyReport } from "@/lib/reports";
import { getKpiActor, canViewDepartmentKpi } from "@/lib/kpi/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const departmentId = params.get("departmentId");
    const weekStart = params.get("weekStart"); // ISO date for Monday

    if (!weekStart) return NextResponse.json({ success: false, error: "Thiếu weekStart" }, { status: 400 });

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (departmentId && !canViewDepartmentKpi(auth.actor)) {
      return NextResponse.json({ success: false, error: "Không có quyền xem báo cáo này." }, { status: 403 });
    }

    if (auth.actor.role === "MANAGER" && departmentId && auth.actor.departmentId !== departmentId) {
      return NextResponse.json({ success: false, error: "MANAGER chỉ được xem báo cáo phòng mình." }, { status: 403 });
    }

    const report = await getWeeklyReport({ departmentId, weekStart });

    return NextResponse.json({ success: true, data: report, message: "Thành công" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 500 });
  }
}
