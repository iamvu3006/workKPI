import type { MonthlyReport } from "@/lib/reports";

/**
 * Minimal CSV exporter used as a fallback for MVP. TODO: replace with real XLSX generation.
 */
export function generateMonthlyReportCsv(report: MonthlyReport): { filename: string; content: string } {
  const dept = report.department?.name ?? "Company";
  const filename = `KPI_${dept.replace(/[^a-zA-Z0-9_-]/g, "_")}_${String(report.month).padStart(2, "0")}_${report.year}.csv`;

  const header = ["STT","Họ tên","Email","Phòng ban","Điểm KPI","Xếp loại","Số task hoàn thành","Tỷ lệ đúng hạn"];

  const lines = [header.join(",")];

  report.members.forEach((m, idx) => {
    const row = [
      String(idx + 1),
      m.fullName ?? "",
      m.email,
      report.department?.name ?? "",
      m.kpiScore?.toString() ?? "",
      m.grade ?? "",
      String(m.tasksCompleted),
      m.onTimeRate?.toString() ?? "",
    ];
    // Escape commas by wrapping in quotes where needed
    lines.push(row.map((c) => (typeof c === "string" && c.includes(",") ? `"${c.replace(/"/g, '""') }"` : c)).join(","));
  });

  return { filename, content: lines.join("\n") };
}
