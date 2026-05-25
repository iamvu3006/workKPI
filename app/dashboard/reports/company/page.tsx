import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import CompanyKpiComponent from "@/components/reports/company-kpi-report";

type Props = { searchParams?: { month?: string; year?: string } };

export default async function Page({ searchParams }: Props) {
  const month = Number(searchParams?.month ?? new Date().getMonth() + 1);
  const year = Number(searchParams?.year ?? new Date().getFullYear());

  const q = new URLSearchParams({ month: String(month), year: String(year) });
  const requestHeaders = headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${forwardedProto}://${host}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/reports/company-kpi?${q.toString()}`, { cache: "no-store" });
  const payload = await res.json();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Báo cáo</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">KPI Toàn công ty</h1>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            ← Dashboard
          </Link>
        </header>
        <CompanyKpiComponent data={payload?.success ? payload.data : null} error={payload?.success ? null : payload?.error ?? "Không thể tải báo cáo"} />
      </div>
    </main>
  );
}
