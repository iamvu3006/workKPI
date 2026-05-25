import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface KpiPersonalCardProps {
  totalScore: number;
  grade: "EXCELLENT" | "GOOD" | "PASS" | "NEEDS_IMPROVEMENT";
  onTimeRate: number;
}

const GRADE_CONFIG = {
  EXCELLENT: { label: "Xuất sắc", color: "bg-green-100 text-green-800", score: "≥ 90" },
  GOOD: { label: "Tốt", color: "bg-blue-100 text-blue-800", score: "75–89" },
  PASS: { label: "Đạt", color: "bg-amber-100 text-amber-700", score: "65–74" },
  NEEDS_IMPROVEMENT: { label: "Cần cải thiện", color: "bg-red-100 text-red-800", score: "< 65" },
};

export function KpiPersonalCard({ totalScore, grade, onTimeRate }: KpiPersonalCardProps) {
  const config = GRADE_CONFIG[grade];

  return (
    <Card className="border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">KPI Tháng hiện tại</h2>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* Score */}
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-xs font-medium uppercase text-slate-600">Điểm KPI</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalScore.toFixed(1)}</p>
          <p className="mt-1 text-xs text-slate-500">/ 100</p>
        </div>

        {/* Grade */}
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-xs font-medium uppercase text-slate-600">Xếp loại</p>
          <div className="mt-2">
            <Badge className={`${config.color}`}>{config.label}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500">{config.score}</p>
        </div>

        {/* On-time rate */}
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-xs font-medium uppercase text-slate-600">Đúng hạn</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{onTimeRate.toFixed(0)}%</p>
          <p className="mt-1 text-xs text-slate-500">Task hoàn thành</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Tiến trình</span>
          <span>{totalScore.toFixed(1)} / 100</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full transition-all ${
              totalScore >= 90
                ? "bg-green-500"
                : totalScore >= 75
                  ? "bg-blue-500"
                  : totalScore >= 65
                    ? "bg-amber-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${Math.min(totalScore, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
