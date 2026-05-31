import React from "react";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import WeeklyProgressReport from "@/components/reports/weekly-progress-report";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

type ReportSearchParams = { period?: string; weekStart?: string; month?: string; year?: string };
type Props = { searchParams?: Promise<ReportSearchParams> | ReportSearchParams };

function firstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeProgressPeriod(period?: string | string[]) {
  const normalized = firstSearchParam(period);
  if (normalized === "month" || normalized === "quarter" || normalized === "year") return normalized;
  return "week";
}

function getMonday(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
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
    select: { role: true },
  });

  if (!profile) {
    redirect("/auth/login");
  }

  if (profile.role === "MANAGER") {
    redirect("/dashboard/reports/monthly");
  }

  if (profile.role === "DIRECTOR" || profile.role === "ADMIN") {
    redirect("/dashboard/reports/company");
  }

  if (profile.role !== "EMPLOYEE" && profile.role !== "LEADER") {
    redirect("/dashboard");
  }

  const period = normalizeProgressPeriod(params.period);
  const now = new Date();
  const month = Number(firstSearchParam(params.month) ?? now.getMonth() + 1);
  const year = Number(firstSearchParam(params.year) ?? now.getFullYear());
  const weekStart = firstSearchParam(params.weekStart) ?? getMonday().toISOString();

  const q = new URLSearchParams({ period, month: String(month), year: String(year) });
  if (period === "week") {
    q.set("weekStart", weekStart);
  }

  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host");
  const cookie = requestHeaders.get("cookie") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${forwardedProto}://${host}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/reports/weekly?${q.toString()}`, {
    cache: "no-store",
    headers: cookie ? { Cookie: cookie } : undefined,
  });
  const payload = await res.json();
  const exportUrl = `/api/reports/export?type=progress&period=${period}&month=${month}&year=${year}${period === "week" ? `&weekStart=${weekStart}` : ""}`;
  const basePeriodQuery = `month=${month}&year=${year}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Báo cáo</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Báo cáo tiến độ</h1>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            ← Dashboard
          </Link>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/reports/weekly?${basePeriodQuery}&period=week${period === "week" ? `&weekStart=${encodeURIComponent(weekStart)}` : ""}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "week" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Tuần
          </Link>
          <Link
            href={`/dashboard/reports/weekly?${basePeriodQuery}&period=month`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "month" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Tháng
          </Link>
          <Link
            href={`/dashboard/reports/weekly?${basePeriodQuery}&period=quarter`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "quarter" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Quý
          </Link>
          <Link
            href={`/dashboard/reports/weekly?${basePeriodQuery}&period=year`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === "year" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Năm
          </Link>
        </div>
        <WeeklyProgressReport data={payload?.success ? payload.data : null} error={payload?.success ? null : payload?.error ?? "Không thể tải báo cáo"} exportUrl={exportUrl} />
      </div>
    </main>
  );
}
