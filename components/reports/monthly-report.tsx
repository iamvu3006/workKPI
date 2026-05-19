import React from "react";

export default function MonthlyReportComponent({ report, error }: { report: any; error?: string | null }) {
  if (error) {
    return (
      <section>
        <h1>Báo cáo Tháng</h1>
        <div>{error}</div>
      </section>
    );
  }

  if (!report) {
    return (
      <section>
        <h1>Báo cáo Tháng</h1>
        <div>Chưa có dữ liệu cho tháng này.</div>
      </section>
    );
  }

  const members = Array.isArray(report.members) ? report.members : [];
  const exportDisabled = report.kpiCalculated === false;
  return (
    <section>
      <h1>Báo cáo Tháng</h1>
      {report.kpiCalculated === false ? (
        <div style={{ margin: "12px 0", padding: 12, border: "1px solid #f5c542", background: "#fff8dd" }}>
          KPI tháng này chưa được tính. Liên hệ admin.
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>{report.department?.name ?? "Toàn công ty"} — {report.month}/{report.year}</h2>
          <p>Avg KPI: {report.avgKpiScore ?? "N/A"}</p>
          <p>
            So với tháng trước: {typeof report.comparedToPrevMonth === "number" ? `${report.comparedToPrevMonth >= 0 ? "+" : ""}${report.comparedToPrevMonth}` : "N/A"}
          </p>
        </div>
        <div>
          {exportDisabled ? (
            <span aria-disabled="true" style={{ opacity: 0.5 }} className="btn">
              Export Excel
            </span>
          ) : (
            <a href={`/api/reports/export?type=monthly&month=${report.month}&year=${report.year}${report.department?.id ? `&departmentId=${report.department.id}` : ""}`} className="btn">
              Export Excel
            </a>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", margin: "16px 0" }}>
        <div>Tổng task: {report.summary?.totalTasks ?? 0}</div>
        <div>Done: {report.summary?.doneTasks ?? 0}</div>
        <div>Trễ hạn: {report.summary?.lateTasks ?? 0}</div>
        <div>Hủy: {report.summary?.cancelledTasks ?? 0}</div>
        <div>Tỷ lệ đúng hạn: {report.summary?.onTimeRate ?? 0}%</div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
        <div>Top performer: {report.topPerformer?.fullName ?? "N/A"}</div>
        <div>Bottom performer: {report.bottomPerformer?.fullName ?? "N/A"}</div>
      </div>

      <div style={{ margin: "16px 0" }}>
        <h3>Biểu đồ so sánh KPI nhân viên</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {members.slice(0, 8).map((m: any) => (
            <div key={m.userId} style={{ display: "grid", gridTemplateColumns: "180px 1fr 70px", gap: 8, alignItems: "center" }}>
              <span>{m.fullName ?? m.email}</span>
              <div style={{ background: "#eee", height: 10, borderRadius: 999 }}>
                <div style={{ width: `${Math.min(100, Number(m.kpiScore ?? 0))}%`, height: "100%", background: "#2563eb", borderRadius: 999 }} />
              </div>
              <span>{m.kpiScore ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Điểm KPI</th>
            <th>Xếp loại</th>
            <th>Số task hoàn thành</th>
            <th>Tỷ lệ đúng hạn</th>
          </tr>
        </thead>
        <tbody>
          {members.length ? members.map((m: any, idx: number) => (
            <tr key={m.userId}>
              <td>{idx + 1}</td>
              <td>{m.fullName}</td>
              <td>{m.email}</td>
              <td>{m.kpiScore ?? ""}</td>
              <td>{m.grade ?? ""}</td>
              <td>{m.tasksCompleted}</td>
              <td>{m.onTimeRate ?? ""}</td>
            </tr>
          )) : (
            <tr><td colSpan={7}>Chưa có dữ liệu cho tháng này.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
