import React from "react";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import MonthlyReportComponent from "@/components/reports/monthly-report";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

type ReportSearchParams = { month?: string; year?: string; departmentId?: string; period?: string };
type Props = { searchParams?: Promise<ReportSearchParams> | ReportSearchParams };

function resolvePeriod(period?: string) {
  return period === "quarter" || period === "year" ? period : "month";
}

export default async function Page({ searchParams }: Props) {
  const params = (await Promise.resolve(searchParams)) ?? {};

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, departmentId: true },
  });

  if (!profile) {
    redirect("/auth/login");
  }

  if (profile.role === "EMPLOYEE" || profile.role === "LEADER") {
    redirect("/dashboard/reports/weekly");
  }

  if (profile.role === "DIRECTOR") {
    redirect("/dashboard/reports/company");
  }

  if (profile.role !== "MANAGER" && profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const month = Number(params.month ?? new Date().getMonth() + 1);
  const year = Number(params.year ?? new Date().getFullYear());
  const period = resolvePeriod(params.period);
  const departmentId = profile.role === "MANAGER" ? profile.departmentId : params.departmentId;

  const q = new URLSearchParams({ month: String(month), year: String(year), period });
  if (departmentId) q.set("departmentId", departmentId);

  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host");
  const cookie = requestHeaders.get("cookie") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${forwardedProto}://${host}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/reports/monthly?${q.toString()}`, {
    cache: "no-store",
    headers: cookie ? { Cookie: cookie } : undefined,
  });
  const payload = await res.json();
  const basePeriodQuery = `month=${month}&year=${year}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Báo cáo</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Báo cáo phòng ban</h1>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            ← Dashboard
          </Link>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/reports/monthly?${basePeriodQuery}&period=month`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "month" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Tháng
          </Link>
          <Link
            href={`/dashboard/reports/monthly?${basePeriodQuery}&period=quarter`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "quarter" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Quý
          </Link>
          <Link
            href={`/dashboard/reports/monthly?${basePeriodQuery}&period=year`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "year" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Năm
          </Link>
        </div>
        <MonthlyReportComponent report={payload?.success ? payload.data : null} error={payload?.success ? null : payload?.error ?? "Không thể tải báo cáo"} />
      </div>
    </main>
  );
}
