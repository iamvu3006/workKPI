import React from "react";

export default function WeeklyProgressReport({ data, error }: { data: any; error?: string | null }) {
  if (error) {
    return (
      <section>
        <h1>Báo cáo Tiến độ Task theo Tuần</h1>
        <div>{error}</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h1>Báo cáo Tiến độ Task theo Tuần</h1>
        <div>Chưa có dữ liệu cho tuần này.</div>
      </section>
    );
  }

  const status = data.tasksByStatus ?? { done: 0, inProgress: 0, pending: 0, review: 0 };

  return (
    <section>
      <h1>Báo cáo Tiến độ Task theo Tuần</h1>
      <p>{new Date(data.weekStart).toLocaleDateString()} - {new Date(data.weekEnd).toLocaleDateString()}</p>
      <p>Tỷ lệ hoàn thành đúng hạn: {data.onTimeRate ?? 0}%</p>

      <div style={{ margin: "16px 0" }}>
        <h3>Biểu đồ trạng thái theo tuần</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {([
            ["DONE", status.done, "#16a34a"],
            ["IN_PROGRESS", status.inProgress, "#2563eb"],
            ["PENDING", status.pending, "#f59e0b"],
            ["REVIEW", status.review, "#7c3aed"],
          ] as const).map(([label, value, color]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "140px 1fr 70px", gap: 8, alignItems: "center" }}>
              <span>{label}</span>
              <div style={{ background: "#eee", height: 10, borderRadius: 999 }}>
                <div style={{ width: `${Math.min(100, value * 10)}%`, height: "100%", background: color, borderRadius: 999 }} />
              </div>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", margin: "16px 0" }}>
        <div>Done: {status.done}</div>
        <div>In Progress: {status.inProgress}</div>
        <div>Pending: {status.pending}</div>
        <div>Review: {status.review}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>So với tuần trước</strong>
        <div>Done delta: {data.comparedToPrevWeek?.done ?? 0}</div>
        <div>On-time rate delta: {data.comparedToPrevWeek?.onTimeRate ?? 0}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Trạng thái</th>
            <th>Số lượng</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Done</td><td>{status.done}</td></tr>
          <tr><td>In Progress</td><td>{status.inProgress}</td></tr>
          <tr><td>Pending</td><td>{status.pending}</td></tr>
          <tr><td>Review</td><td>{status.review}</td></tr>
        </tbody>
      </table>
    </section>
  );
}
