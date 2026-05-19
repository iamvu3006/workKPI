import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { KpiBreakdownTable } from "@/components/kpi/kpi-breakdown-table";
import { KpiPersonalCard } from "@/components/kpi/kpi-personal-card";
import { KpiTrendChart } from "@/components/kpi/kpi-trend-chart";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";

export default async function KpiPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch current month KPI
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let currentKpi: Record<string, unknown> | null = null;
  let trendData = [];
  let error = "";

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/kpi/me?month=${currentMonth}&year=${currentYear}`,
      {
        headers: {
          Cookie: (await cookieStore).toString(),
        },
      }
    );

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        currentKpi = json.data;
      } else {
        error = json.error || "Không thể lấy dữ liệu KPI";
      }
    } else if (res.status === 404) {
      // No KPI calculated yet for this month
      currentKpi = null;
    } else {
      error = "Lỗi khi lấy dữ liệu";
    }
  } catch {
    error = "Lỗi kết nối tới server";
  }

  // Fetch trend data (last 6 months)
  try {
    const promises = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      promises.push(
        fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/kpi/me?month=${m}&year=${y}`,
          {
            headers: {
              Cookie: (await cookieStore).toString(),
            },
          }
        )
          .then((r) => r.json())
          .catch(() => null)
      );
    }

    const results = await Promise.all(promises);
    trendData = results
      .filter((r) => r && r.success && r.data)
      .map((r) => ({
        month: r.data.month,
        year: r.data.year,
        score: r.data.totalScore,
      }));
  } catch {
    // Silent fail for trend
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">KPI Của bạn</h1>
        <p className="mt-2 text-slate-600">
          Tháng {currentMonth} / {currentYear}
        </p>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {!currentKpi ? (
          <Card className="mt-6 border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">
              KPI tháng này chưa được tính toán. Hãy quay lại sau khi Trưởng phòng chấm điểm.
            </p>
          </Card>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Personal card */}
            <KpiPersonalCard
              totalScore={(currentKpi.totalScore as number) || 0}
              grade={(currentKpi.grade as any) || "NEEDS_IMPROVEMENT"}
              onTimeRate={(currentKpi.onTimeRate as number) || 0}
            />

            {/* Breakdown table */}
            <KpiBreakdownTable
              tasks={
                (currentKpi.taskBreakdown as any[])?.map((t: any) => ({
                  taskId: t.taskId,
                  taskTitle: t.taskTitle,
                  weight: t.weight,
                  progress: t.progress,
                  qualityScore: t.qualityScore,
                  contribution: t.contribution,
                  penaltyDays: t.penaltyDays,
                })) || []
              }
            />

            {/* Trend chart */}
            {trendData.length > 0 && <KpiTrendChart data={trendData} />}
          </div>
        )}
      </div>
    </main>
  );
}
