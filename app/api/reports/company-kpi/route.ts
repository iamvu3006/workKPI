import { NextResponse } from "next/server";
import { getCompanyKpi } from "@/lib/reports";
import { getKpiActor } from "@/lib/kpi/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const month = Number(params.get("month"));
    const year = Number(params.get("year"));
    const periodParam = params.get("period");
    const period = periodParam === "quarter" || periodParam === "year" ? periodParam : "month";

    if (!month || !year) return NextResponse.json({ success: false, error: "Thiếu month/year" }, { status: 400 });

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    // Only ADMIN / DIRECTOR can view company-level KPI — check role
    if (!(auth.actor.role === "ADMIN" || auth.actor.role === "DIRECTOR")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem báo cáo toàn công ty." }, { status: 403 });
    }

    const report = await getCompanyKpi({ month, year, period });

    return NextResponse.json({ success: true, data: report, message: "Thành công" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 500 });
  }
}
