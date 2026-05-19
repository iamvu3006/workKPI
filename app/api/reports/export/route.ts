import { NextResponse } from "next/server";
import { getMonthlyReport } from "@/lib/reports";
import { getKpiActor, canViewDepartmentKpi } from "@/lib/kpi/auth";
import { generateMonthlyReportCsv } from "@/lib/export/excel-report";
import { prisma } from "@/lib/db/prisma";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const type = params.get("type");
    const departmentId = params.get("departmentId");
    const month = Number(params.get("month"));
    const year = Number(params.get("year"));

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (departmentId && !canViewDepartmentKpi(auth.actor)) {
      return NextResponse.json({ success: false, error: "Không có quyền export báo cáo này." }, { status: 403 });
    }

    if (auth.actor.role === "MANAGER" && departmentId && auth.actor.departmentId !== departmentId) {
      return NextResponse.json({ success: false, error: "MANAGER chỉ được export báo cáo phòng mình." }, { status: 403 });
    }

    if (type !== "monthly") {
      return NextResponse.json({ success: false, error: "Loại export không được hỗ trợ." }, { status: 400 });
    }

    if (!month || !year) return NextResponse.json({ success: false, error: "Thiếu month/year" }, { status: 400 });

    // Count total rows using kpi_records joined with user.department
    const where: any = { month, year };
    if (departmentId) where.user = { departmentId };

    const total = await prisma.kpiRecord.count({ where });
    const department = departmentId
      ? await prisma.department.findUnique({ where: { id: departmentId }, select: { name: true } })
      : null;
    if (total === 0) {
      const { filename, content } = generateMonthlyReportCsv(await getMonthlyReport({ departmentId, month, year }));
      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (total > 10000) {
      return NextResponse.json({ success: false, error: "Export vượt giới hạn 10.000 dòng. Hãy thu hẹp bộ lọc." }, { status: 413 });
    }

    const pageSize = 2000;
    const pages = Math.ceil(total / pageSize);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Monthly KPI");
    const header = ["STT","Họ tên","Email","Phòng ban","Điểm KPI","Xếp loại","Số task hoàn thành","Tỷ lệ đúng hạn"];
    ws.addRow(header);

    let offset = 0;
    let idx = 0;
    for (let page = 0; page < pages; page++) {
      const records = await prisma.kpiRecord.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true, department: { select: { name: true } } } } },
        orderBy: { totalScore: "desc" },
        skip: offset,
        take: pageSize,
      });

      for (const r of records) {
        idx += 1;
        ws.addRow([
          idx,
          r.user?.fullName ?? "",
          r.user?.email ?? "",
          r.user?.department?.name ?? department?.name ?? "",
          r.totalScore,
          r.grade,
          Array.isArray(r.taskBreakdown) ? r.taskBreakdown.length : 0,
          r.onTimeRate ?? null,
        ]);
      }

      offset += records.length;
    }

    ws.columns = [
      { width: 6 },
      { width: 30 },
      { width: 32 },
      { width: 20 },
      { width: 12 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
    ];
    ws.getRow(1).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `KPI_${(department?.name ?? "Company").replace(/[^a-zA-Z0-9_-]/g, "_")}_${String(month).padStart(2, "0")}_${year}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server khi xuất báo cáo." }, { status: 500 });
  }
}
