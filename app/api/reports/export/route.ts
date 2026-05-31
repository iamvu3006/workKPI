import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getMonthlyReport } from "@/lib/reports";
import { getCompanyKpi } from "@/lib/reports";
import { getProgressReport } from "@/lib/reports";
import { getKpiActor, canViewDepartmentKpi } from "@/lib/kpi/auth";
import { generateMonthlyReportCsv } from "@/lib/export/excel-report";
import { prisma } from "@/lib/db/prisma";

function isValidPeriod(period: string | null): period is "month" | "quarter" | "year" {
  return period === "month" || period === "quarter" || period === "year";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const type = params.get("type");
    const departmentId = params.get("departmentId");
    const month = Number(params.get("month"));
    const year = Number(params.get("year"));
    const periodParam = params.get("period");
    const period = isValidPeriod(periodParam) ? periodParam : "month";
    const progressPeriod =
      periodParam === "week" || periodParam === "month" || periodParam === "quarter" || periodParam === "year"
        ? periodParam
        : "week";

    const auth = await getKpiActor();
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (type === "progress") {
      if (!(auth.actor.role === "EMPLOYEE" || auth.actor.role === "LEADER")) {
        return NextResponse.json({ success: false, error: "Không có quyền export báo cáo tiến độ này." }, { status: 403 });
      }

      if (progressPeriod !== "week" && (!month || !year)) {
        return NextResponse.json({ success: false, error: "Thiếu month/year" }, { status: 400 });
      }

      if (progressPeriod === "week" && !params.get("weekStart")) {
        return NextResponse.json({ success: false, error: "Thiếu weekStart" }, { status: 400 });
      }

      const report = await getProgressReport({
        period: progressPeriod,
        weekStart: params.get("weekStart") ?? undefined,
        month,
        year,
        departmentId: auth.actor.departmentId,
        assigneeId: auth.actor.role === "EMPLOYEE" ? auth.actor.id : undefined,
        teamId: auth.actor.role === "LEADER" ? auth.actor.teamId ?? undefined : undefined,
      });

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Progress");
      ws.addRow(["Kỳ báo cáo", report.periodLabel]);
      ws.addRow(["Phòng ban", report.department?.name ?? "N/A"]);
      ws.addRow(["Từ", report.weekStart]);
      ws.addRow(["Đến", report.weekEnd]);
      ws.addRow([]);
      ws.addRow(["Chỉ số", "Giá trị"]);
      ws.addRow(["Done", report.tasksByStatus.done]);
      ws.addRow(["In Progress", report.tasksByStatus.inProgress]);
      ws.addRow(["Pending", report.tasksByStatus.pending]);
      ws.addRow(["Review", report.tasksByStatus.review]);
      ws.addRow(["Tỷ lệ đúng hạn", report.onTimeRate]);
      ws.addRow(["So với kỳ trước - Done", report.comparedToPrevWeek.done]);
      ws.addRow(["So với kỳ trước - On-time", report.comparedToPrevWeek.onTimeRate]);
      ws.columns = [{ width: 28 }, { width: 24 }];
      ws.getRow(1).font = { bold: true };
      ws.getRow(6).font = { bold: true };

      const buffer = await wb.xlsx.writeBuffer();
      const weekStartValue = params.get("weekStart");
      const periodSuffix = progressPeriod === "week"
        ? `week_${(weekStartValue ? new Date(weekStartValue) : new Date()).toISOString().slice(0, 10)}`
        : `${progressPeriod}_${String(month).padStart(2, "0")}_${year}`;
      const filename = `TienDo_${periodSuffix}.xlsx`;

      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (!month || !year) return NextResponse.json({ success: false, error: "Thiếu month/year" }, { status: 400 });

    if (type === "monthly") {
      if (departmentId && !canViewDepartmentKpi(auth.actor)) {
        return NextResponse.json({ success: false, error: "Không có quyền export báo cáo này." }, { status: 403 });
      }

      if (auth.actor.role === "MANAGER" && departmentId && auth.actor.departmentId !== departmentId) {
        return NextResponse.json({ success: false, error: "MANAGER chỉ được export báo cáo phòng mình." }, { status: 403 });
      }

      // Count total rows using kpi_records joined with user.department
      const where: any = { month, year };
      if (departmentId) where.user = { departmentId };

      const total = await prisma.kpiRecord.count({ where });
      const department = departmentId
        ? await prisma.department.findUnique({ where: { id: departmentId }, select: { name: true } })
        : null;
      if (total === 0) {
        const { filename, content } = generateMonthlyReportCsv(await getMonthlyReport({ departmentId, month, year, period }));
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
      const header = ["STT", "Họ tên", "Email", "Phòng ban", "Điểm KPI", "Xếp loại", "Số task hoàn thành", "Tỷ lệ đúng hạn"];
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
      const periodSuffix = period === "month" ? `${String(month).padStart(2, "0")}_${year}` : `${period}_${year}`;
      const filename = `KPI_${(department?.name ?? "Company").replace(/[^a-zA-Z0-9_-]/g, "_")}_${periodSuffix}.xlsx`;

      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (type === "company") {
      if (!(auth.actor.role === "ADMIN" || auth.actor.role === "DIRECTOR")) {
        return NextResponse.json({ success: false, error: "Không có quyền export báo cáo toàn công ty." }, { status: 403 });
      }

      const report = await getCompanyKpi({ month, year, period });
      const wb = new ExcelJS.Workbook();

      const departmentSheet = wb.addWorksheet("Departments");
      departmentSheet.addRow(["Xếp hạng", "Phòng ban", "Điểm trung bình", "Số nhân sự"]);
      report.departments.forEach((department) => {
        departmentSheet.addRow([department.rank, department.department_name, department.avg_score ?? "N/A", department.member_count]);
      });
      departmentSheet.columns = [
        { width: 10 },
        { width: 28 },
        { width: 16 },
        { width: 14 },
      ];
      departmentSheet.getRow(1).font = { bold: true };

      const performerSheet = wb.addWorksheet("Top Performers");
      performerSheet.addRow(["STT", "Họ tên", "Phòng ban", "Điểm KPI", "Xếp loại"]);
      report.topPerformers.forEach((item, index) => {
        performerSheet.addRow([index + 1, item.fullName ?? "N/A", item.departmentName ?? "N/A", item.totalScore, item.grade]);
      });
      performerSheet.columns = [
        { width: 8 },
        { width: 30 },
        { width: 24 },
        { width: 14 },
        { width: 18 },
      ];
      performerSheet.getRow(1).font = { bold: true };

      const buffer = await wb.xlsx.writeBuffer();
      const periodSuffix = report.periodLabel ? report.periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_") : `${month}_${year}`;
      const filename = `KPI_Toan_cong_ty_${periodSuffix}.xlsx`;

      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Loại export không được hỗ trợ." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Lỗi server khi xuất báo cáo." }, { status: 500 });
  }
}
