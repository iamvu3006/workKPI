import { NextResponse } from "next/server";
import { getMonthlyReport, getMonthlyReportPaginated } from "@/lib/reports";
import { getKpiActor, canViewDepartmentKpi } from "@/lib/kpi/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const departmentId = params.get("departmentId");
    const month = Number(params.get("month"));
    const year = Number(params.get("year"));

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Thiếu tham số month/year." }, { status: 400 });
    }

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (departmentId && !canViewDepartmentKpi(auth.actor)) {
      return NextResponse.json({ success: false, error: "Không có quyền xem báo cáo này." }, { status: 403 });
    }

    // Managers may only view reports for their own department
    if (auth.actor.role === "MANAGER" && departmentId && auth.actor.departmentId !== departmentId) {
      return NextResponse.json({ success: false, error: "MANAGER chỉ được xem báo cáo phòng mình." }, { status: 403 });
    }

    const page = params.get("page") ? Number(params.get("page")) : undefined;
    const pageSize = params.get("pageSize") ? Number(params.get("pageSize")) : undefined;

    let report;
    if (page && pageSize) {
      report = await getMonthlyReportPaginated({ departmentId, month, year, page, pageSize });
    } else {
      report = await getMonthlyReport({ departmentId, month, year });
    }

    return NextResponse.json({ success: true, data: report, message: "Thành công" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server khi lấy báo cáo." }, { status: 500 });
  }
}
