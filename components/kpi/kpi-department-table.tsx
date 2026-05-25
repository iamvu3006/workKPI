import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DepartmentKpiRow {
  userId: string;
  userName: string;
  totalScore: number;
  grade: "EXCELLENT" | "GOOD" | "PASS" | "NEEDS_IMPROVEMENT";
  tasksDone: number;
  onTimeRate: number;
}

interface KpiDepartmentTableProps {
  data: DepartmentKpiRow[];
}

const GRADE_CONFIG = {
  EXCELLENT: { label: "Xuất sắc", color: "bg-green-100 text-green-800" },
  GOOD: { label: "Tốt", color: "bg-blue-100 text-blue-800" },
  PASS: { label: "Đạt", color: "bg-amber-100 text-amber-700" },
  NEEDS_IMPROVEMENT: { label: "Cần cải thiện", color: "bg-red-100 text-red-800" },
};

export function KpiDepartmentTable({ data }: KpiDepartmentTableProps) {
  return (
    <Card className="border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Xếp hạng Nhân viên</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium text-slate-700">STT</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Tên</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Điểm KPI</th>
              <th className="px-3 py-2 text-center font-medium text-slate-700">Xếp loại</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Task Done</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Đúng hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row, idx) => {
              const config = GRADE_CONFIG[row.grade];
              return (
                <tr key={row.userId} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-left text-slate-600">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-900">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">{row.userName}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold text-slate-900">{row.totalScore.toFixed(1)}</span>
                    <span className="ml-1 text-xs text-slate-500">/ 100</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge className={config.color}>{config.label}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">{row.tasksDone}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{row.onTimeRate.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">Chưa có dữ liệu KPI</p>
      )}

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
          <div className="text-center">
            <p className="text-xs text-slate-600">Điểm trung bình</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {(data.reduce((sum, row) => sum + row.totalScore, 0) / data.length).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600">Tổng Task Done</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {data.reduce((sum, row) => sum + row.tasksDone, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600">Tỷ lệ đúng hạn TB</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {(data.reduce((sum, row) => sum + row.onTimeRate, 0) / data.length).toFixed(0)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
