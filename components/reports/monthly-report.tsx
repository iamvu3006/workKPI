import React from "react";

export default function MonthlyReportComponent({ report, error }: { report: any; error?: string | null }) {
  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Báo cáo phòng ban</h2>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Báo cáo phòng ban</h2>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">Chưa có dữ liệu cho kỳ này.</p>
        </div>
      </section>
    );
  }

  const members = Array.isArray(report.members) ? report.members : [];
  const exportDisabled = report.kpiCalculated === false;
  const exportUrl = `/api/reports/export?type=monthly&month=${report.month}&year=${report.year}${report.period ? `&period=${report.period}` : ""}${report.department?.id ? `&departmentId=${report.department.id}` : ""}`;

  return (
    <section className="space-y-6">
      {report.kpiCalculated === false ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">KPI tháng này chưa được tính. Liên hệ admin.</p>
        </div>
      ) : null}

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{report.department?.name ?? "Toàn công ty"} — {report.periodLabel ?? `${report.month}/${report.year}`}</h3>
          <p className="mt-1 text-sm text-slate-600">Avg KPI: {report.avgKpiScore ?? "N/A"}</p>
          <p className="mt-1 text-sm text-slate-600">So với kỳ trước: {typeof report.comparedToPrevMonth === "number" ? `${report.comparedToPrevMonth >= 0 ? "+" : ""}${report.comparedToPrevMonth}` : "N/A"}</p>
        </div>
        <div>
          {exportDisabled ? (
            <span aria-disabled="true" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 opacity-50">Export Excel</span>
          ) : (
            <a href={exportUrl} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Export Excel</a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng task", value: report.summary?.totalTasks ?? 0 },
          { label: "Done", value: report.summary?.doneTasks ?? 0 },
          { label: "Trễ hạn", value: report.summary?.lateTasks ?? 0 },
          { label: "Đúng hạn", value: `${report.summary?.onTimeRate ?? 0}%` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top performer</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{report.topPerformer?.fullName ?? "N/A"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bottom performer</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{report.bottomPerformer?.fullName ?? "N/A"}</p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900">Biểu đồ so sánh KPI nhân viên</h3>
        <div className="space-y-3 mt-3">
          {members.slice(0, 8).map((m: any) => (
            <div key={m.userId} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm text-slate-600">{m.fullName ?? m.email}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, Number(m.kpiScore ?? 0))}%` }} />
              </div>
              <span className="w-12 text-right text-sm font-semibold tabular-nums text-slate-900">{m.kpiScore ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">STT</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Họ tên</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Điểm KPI</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Xếp loại</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Số task hoàn thành</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tỷ lệ đúng hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length ? members.map((m: any, idx: number) => (
              <tr key={m.userId} className="transition-colors hover:bg-slate-50/40">
                <td className="px-4 py-3 text-slate-700">{idx + 1}</td>
                <td className="px-4 py-3 text-slate-700">{m.fullName}</td>
                <td className="px-4 py-3 text-slate-700">{m.email}</td>
                <td className="px-4 py-3 text-slate-700">{m.kpiScore ?? ""}</td>
                <td className="px-4 py-3 text-slate-700">{m.grade ?? ""}</td>
                <td className="px-4 py-3 text-slate-700">{m.tasksCompleted}</td>
                <td className="px-4 py-3 text-slate-700">{m.onTimeRate ?? ""}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Chưa có dữ liệu cho tháng này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
