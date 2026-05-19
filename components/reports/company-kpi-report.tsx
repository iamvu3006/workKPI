import React from "react";

export default function CompanyKpiComponent({ data, error }: { data: any; error?: string | null }) {
  if (error) {
    return (
      <section>
        <h1>Báo cáo KPI Toàn công ty</h1>
        <div>{error}</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h1>Báo cáo KPI Toàn công ty</h1>
        <div>Chưa có dữ liệu cho tháng này.</div>
      </section>
    );
  }

  const departments = Array.isArray(data.departments) ? data.departments : [];
  const topPerformers = Array.isArray(data.topPerformers) ? data.topPerformers : [];
  return (
    <section>
      <h1>Báo cáo KPI Toàn công ty</h1>
      <p>Tháng {data.month}/{data.year}</p>
      <p>Tỷ lệ đúng hạn toàn công ty: {data.onTimeRate ?? 0}%</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", margin: "16px 0" }}>
        <div>Phòng ban: {departments.length}</div>
        <div>Top 5 nhân viên: {topPerformers.length}</div>
      </div>

      <div style={{ margin: "16px 0" }}>
        <h3>Biểu đồ so sánh KPI theo phòng ban</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {departments.slice(0, 8).map((d: any) => (
            <div key={d.department_id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 70px", gap: 8, alignItems: "center" }}>
              <span>{d.department_name}</span>
              <div style={{ background: "#eee", height: 10, borderRadius: 999 }}>
                <div style={{ width: `${Math.min(100, Number(d.avg_score ?? 0) * 10)}%`, height: "100%", background: "#16a34a", borderRadius: 999 }} />
              </div>
              <span>{Number(d.avg_score ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Xếp hạng</th>
            <th>Phòng ban</th>
            <th>Điểm trung bình</th>
            <th>Số nhân sự</th>
          </tr>
        </thead>
        <tbody>
          {departments.length ? departments.map((d: any) => (
            <tr key={d.department_id}>
              <td>{d.rank}</td>
              <td>{d.department_name}</td>
              <td>{Number(d.avg_score).toFixed(2)}</td>
              <td>{d.member_count}</td>
            </tr>
          )) : (
            <tr><td colSpan={4}>Chưa có dữ liệu cho tháng này.</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <h2>Top 5 nhân viên</h2>
        <ol>
          {topPerformers.map((item: any) => (
            <li key={item.userId}>
              {item.fullName ?? "N/A"} - {item.departmentName ?? "N/A"} - {item.totalScore.toFixed(2)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
