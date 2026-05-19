import React from "react";
import CompanyKpiComponent from "@/components/reports/company-kpi-report";

type Props = { searchParams?: { month?: string; year?: string } };

export default async function Page({ searchParams }: Props) {
  const month = Number(searchParams?.month ?? new Date().getMonth() + 1);
  const year = Number(searchParams?.year ?? new Date().getFullYear());

  const q = new URLSearchParams({ month: String(month), year: String(year) });

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/reports/company-kpi?${q.toString()}`, { cache: "no-store" });
  const payload = await res.json();

  return (
    <div>
      <CompanyKpiComponent data={payload?.success ? payload.data : null} error={payload?.success ? null : payload?.error ?? "Không thể tải báo cáo"} />
    </div>
  );
}
