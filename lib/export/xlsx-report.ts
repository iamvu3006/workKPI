import ExcelJS from "exceljs";
import type { MonthlyReport } from "@/lib/reports";

export async function generateMonthlyReportXlsx(report: MonthlyReport): Promise<{ filename: string; buffer: Buffer }> {
  const dept = report.department?.name ?? "Company";
  const filename = `KPI_${dept.replace(/[^a-zA-Z0-9_-]/g, "_")}_${String(report.month).padStart(2, "0")}_${report.year}.xlsx`;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Monthly KPI");

  const header = ["STT","Họ tên","Email","Phòng ban","Điểm KPI","Xếp loại","Số task hoàn thành","Tỷ lệ đúng hạn"];
  ws.addRow(header);

  report.members.forEach((m, idx) => {
    ws.addRow([
      idx + 1,
      m.fullName ?? "",
      m.email,
      report.department?.name ?? "",
      m.kpiScore ?? null,
      m.grade ?? "",
      m.tasksCompleted,
      m.onTimeRate ?? null,
    ]);
  });

  // Basic formatting
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

  return { filename, buffer: Buffer.from(buffer) };
}
