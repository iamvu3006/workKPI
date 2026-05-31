import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { KpiDepartmentTable } from "@/components/kpi/kpi-department-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { countTaskBreakdownItems } from "@/lib/kpi/task-breakdown";
import { createClient } from "@/utils/supabase/server";

export default async function KpiDepartmentPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is Manager or Admin
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, departmentId: true },
  });

  if (!profile) redirect("/auth/login");

  if (profile.role !== "MANAGER" && profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch department KPI
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let departmentData = [];
  let error = "";
  let departmentName = "";

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/kpi/department?month=${currentMonth}&year=${currentYear}`,
      {
        headers: {
          Cookie: (await cookieStore).toString(),
        },
      }
    );

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        departmentData = json.data || [];

        // Get department name
        if (profile.departmentId) {
          const dept = await prisma.department.findUnique({
            where: { id: profile.departmentId },
            select: { name: true },
          });
          departmentName = dept?.name || "";
        }
      } else {
        error = json.error || "Không thể lấy dữ liệu";
      }
    } else if (res.status === 404) {
      departmentData = [];
    } else {
      error = "Lỗi khi lấy dữ liệu";
    }
  } catch {
    error = "Lỗi kết nối tới server";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">KPI</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">KPI Phòng ban — {departmentName}</h1>
            <p className="mt-1 text-sm text-slate-500">Tháng {currentMonth} / {currentYear}</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard">← Quay lại</Link></Button>
        </header>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {departmentData.length === 0 ? (
          <Card className="mt-6 border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">
              Chưa có KPI nào được tính toán cho phòng ban này trong tháng {currentMonth}.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/admin/kpi/calculate">Tính KPI ngay</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Summary card */}
            <Card className="border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Tóm tắt Phòng ban</h2>
              <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nhân viên</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{departmentData.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Điểm TB</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {(
                        departmentData.reduce((sum: number, row: any) => sum + row.totalScore, 0) /
                        departmentData.length
                      ).toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Đúng hạn TB</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {(
                        departmentData.reduce((sum: number, row: any) => sum + row.onTimeRate, 0) /
                        departmentData.length
                      ).toFixed(0)}
                    %
                    </p>
                  </div>
                </div>
            </Card>

            {/* Department ranking table */}
            <KpiDepartmentTable
              data={departmentData.map((row: any) => ({
                userId: row.userId,
                userName: row.user?.fullName || row.user?.displayName || "N/A",
                totalScore: row.totalScore,
                grade: row.grade,
                tasksDone: countTaskBreakdownItems(row.taskBreakdown),
                onTimeRate: row.onTimeRate,
              }))}
            />

            {/* Grade distribution */}
            <Card className="border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Phân bố Xếp loại</h2>
              <div className="mt-6 space-y-3">
                {[
                  { grade: "EXCELLENT", label: "Xuất sắc", barClass: "bg-emerald-500" },
                  { grade: "GOOD", label: "Tốt", barClass: "bg-teal-500" },
                  { grade: "PASS", label: "Đạt", barClass: "bg-amber-400" },
                  { grade: "NEEDS_IMPROVEMENT", label: "Cần cải thiện", barClass: "bg-rose-400" },
                ].map(({ grade, label, barClass }) => {
                  const count = departmentData.filter((r: any) => r.grade === grade).length;
                  const percent = departmentData.length > 0 ? (count / departmentData.length) * 100 : 0;

                  return (
                    <div key={grade}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="text-slate-600">{count} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${barClass} transition-all`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
