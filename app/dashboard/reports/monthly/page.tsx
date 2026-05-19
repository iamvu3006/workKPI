import React from "react";
import MonthlyReportComponent from "@/components/reports/monthly-report";

type Props = { searchParams?: { month?: string; year?: string; departmentId?: string } };

export default async function Page({ searchParams }: Props) {
  const month = Number(searchParams?.month ?? new Date().getMonth() + 1);
  const year = Number(searchParams?.year ?? new Date().getFullYear());
  const departmentId = searchParams?.departmentId;

  const q = new URLSearchParams({ month: String(month), year: String(year) });
  if (departmentId) q.set("departmentId", departmentId);

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/reports/monthly?${q.toString()}`, { cache: "no-store" });
  const payload = await res.json();

  return (
    <div>
      <MonthlyReportComponent report={payload?.success ? payload.data : null} error={payload?.success ? null : payload?.error ?? "Không thể tải báo cáo"} />
    </div>
  );
}
