import React from "react";

export default function WeeklyProgressReport({ data, error }: { data: any; error?: string | null }) {
  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Báo cáo Tiến độ Task theo Tuần</h2>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Báo cáo Tiến độ Task theo Tuần</h2>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">Chưa có dữ liệu cho tuần này.</p>
        </div>
      </section>
    );
  }

  const status = data.tasksByStatus ?? { done: 0, inProgress: 0, pending: 0, review: 0 };

  const rows = [
    { label: "DONE", value: status.done, barClass: "bg-emerald-500" },
    { label: "IN_PROGRESS", value: status.inProgress, barClass: "bg-teal-500" },
    { label: "PENDING", value: status.pending, barClass: "bg-amber-400" },
    { label: "REVIEW", value: status.review, barClass: "bg-rose-400" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">{new Date(data.weekStart).toLocaleDateString()} - {new Date(data.weekEnd).toLocaleDateString()}</p>
        <p className="mt-1 text-sm text-slate-600">Tỷ lệ hoàn thành đúng hạn: {data.onTimeRate ?? 0}%</p>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900">Biểu đồ trạng thái theo tuần</h3>
        <div className="space-y-3 mt-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-slate-600">{r.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${r.barClass} transition-all`} style={{ width: `${Math.min(100, Number(r.value) * 10)}%` }} />
              </div>
              <span className="w-12 text-right text-sm font-semibold tabular-nums text-slate-900">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Done</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{status.done}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">In Progress</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{status.inProgress}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{status.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Review</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{status.review}</p>
        </div>
      </div>

      <div>
        <strong className="text-sm text-slate-900">So với tuần trước</strong>
        <div className="mt-2 text-sm text-slate-600">Done delta: {data.comparedToPrevWeek?.done ?? 0}</div>
        <div className="text-sm text-slate-600">On-time rate delta: {data.comparedToPrevWeek?.onTimeRate ?? 0}</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Số lượng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="transition-colors hover:bg-slate-50/40"><td className="px-4 py-3 text-slate-700">Done</td><td className="px-4 py-3 text-slate-700">{status.done}</td></tr>
            <tr className="transition-colors hover:bg-slate-50/40"><td className="px-4 py-3 text-slate-700">In Progress</td><td className="px-4 py-3 text-slate-700">{status.inProgress}</td></tr>
            <tr className="transition-colors hover:bg-slate-50/40"><td className="px-4 py-3 text-slate-700">Pending</td><td className="px-4 py-3 text-slate-700">{status.pending}</td></tr>
            <tr className="transition-colors hover:bg-slate-50/40"><td className="px-4 py-3 text-slate-700">Review</td><td className="px-4 py-3 text-slate-700">{status.review}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
