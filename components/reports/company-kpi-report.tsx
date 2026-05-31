import React from "react";

export default function CompanyKpiComponent({
  data,
  error,
  exportUrl,
}: {
  data: any;
  error?: string | null;
  exportUrl?: string | null;
}) {
  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Báo cáo KPI Toàn công ty</h2>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Báo cáo KPI Toàn công ty</h2>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">Chưa có dữ liệu cho tháng này.</p>
        </div>
      </section>
    );
  }

  const departments = Array.isArray(data.departments) ? data.departments : [];
  const topPerformers = Array.isArray(data.topPerformers) ? data.topPerformers : [];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600">{data.periodLabel ?? `Tháng ${data.month}/${data.year}`}</p>
          <p className="mt-1 text-sm text-slate-600">Tỷ lệ đúng hạn toàn công ty: {data.onTimeRate ?? 0}%</p>
        </div>
        {exportUrl ? (
          <a
            href={exportUrl}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Export Excel
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phòng ban</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{departments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top 20 nhân viên</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{topPerformers.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Biểu đồ so sánh KPI theo phòng ban</h3>
        <div className="space-y-3">
          {departments.slice(0, 8).map((d: any) => (
            <div key={d.department_id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm text-slate-600">{d.department_name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, Number(d.avg_score ?? 0)))}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-semibold tabular-nums text-slate-900">{Number(d.avg_score ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Xếp hạng</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Phòng ban</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Điểm trung bình</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Số nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.length ? departments.map((d: any) => (
              <tr key={d.department_id} className="transition-colors hover:bg-slate-50/40">
                <td className="px-4 py-3 text-slate-700">{d.rank}</td>
                <td className="px-4 py-3 text-slate-700">{d.department_name}</td>
                <td className="px-4 py-3 text-slate-700">{Number(d.avg_score).toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-700">{d.member_count}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Chưa có dữ liệu cho tháng này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900">Top 20 nhân viên</h3>
        <ol className="mt-2 space-y-2">
          {topPerformers.map((item: any) => (
            <li key={item.userId} className="text-sm text-slate-700">
              {item.fullName ?? "N/A"} — <span className="text-slate-500">{item.departmentName ?? "N/A"}</span> — <span className="font-semibold tabular-nums">{Number(item.totalScore ?? 0).toFixed(2)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
