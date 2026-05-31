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
    const periodParam = params.get("period");
    const period = periodParam === "quarter" || periodParam === "year" ? periodParam : "month";

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Thiếu tham số month/year." }, { status: 400 });
    }

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (auth.actor.role !== "MANAGER" && auth.actor.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Không có quyền xem báo cáo phòng ban." }, { status: 403 });
    }

    if (departmentId && !canViewDepartmentKpi(auth.actor)) {
      return NextResponse.json({ success: false, error: "Không có quyền xem báo cáo này." }, { status: 403 });
    }

    let scopedDepartmentId = departmentId;
    if (auth.actor.role === "MANAGER") {
      if (!auth.actor.departmentId) {
        return NextResponse.json({ success: false, error: "Tài khoản MANAGER chưa được gán phòng ban." }, { status: 403 });
      }
      if (departmentId && auth.actor.departmentId !== departmentId) {
        return NextResponse.json({ success: false, error: "MANAGER chỉ được xem báo cáo phòng mình." }, { status: 403 });
      }
      scopedDepartmentId = auth.actor.departmentId;
    }

    const page = params.get("page") ? Number(params.get("page")) : undefined;
    const pageSize = params.get("pageSize") ? Number(params.get("pageSize")) : undefined;

    let report;
    if (page && pageSize && period === "month") {
      report = await getMonthlyReportPaginated({ departmentId: scopedDepartmentId, month, year, page, pageSize });
    } else {
      report = await getMonthlyReport({ departmentId: scopedDepartmentId, month, year, period });
    }

    return NextResponse.json({ success: true, data: report, message: "Thành công" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server khi lấy báo cáo." }, { status: 500 });
  }
}
