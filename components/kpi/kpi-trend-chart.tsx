import { Card } from "@/components/ui/card";

interface TrendDataPoint {
  month: number;
  year: number;
  score: number;
}

interface KpiTrendChartProps {
  data: TrendDataPoint[];
}

const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"];

export function KpiTrendChart({ data }: KpiTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Xu hướng 6 tháng</h2>
        <p className="mt-4 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
      </Card>
    );
  }

  const maxScore = 100;
  const minScore = Math.min(...data.map((d) => d.score), 0);
  const range = maxScore - minScore;

  return (
    <Card className="border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Xu hướng 6 tháng</h2>

      <div className="mt-6">
        {/* Chart bars */}
        <div className="flex items-end gap-2">
          {data.map((point, idx) => {
            const heightPercent = ((point.score - minScore) / range) * 100;
            const isGood = point.score >= 75;

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                {/* Bar */}
                <div className="flex w-full flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isGood ? "bg-teal-500" : "bg-orange-500"
                    }`}
                    style={{ minHeight: "40px", height: `${Math.max(heightPercent, 10)}%` }}
                  />
                </div>
                {/* Label */}
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-900">{point.score.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">
                    {MONTH_NAMES[point.month - 1]?.slice(0, 3)} {point.year}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-teal-500" />
            <span>Tốt (≥75)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span>Cần cải thiện (&lt;75)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
