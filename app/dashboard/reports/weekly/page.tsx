import React from "react";
import WeeklyProgressReport from "@/components/reports/weekly-progress-report";

type Props = { searchParams?: { weekStart?: string; departmentId?: string } };

function getMonday(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

export default async function Page({ searchParams }: Props) {
  const weekStart = searchParams?.weekStart ?? getMonday().toISOString();
  const departmentId = searchParams?.departmentId;

  const q = new URLSearchParams({ weekStart });
  if (departmentId) q.set("departmentId", departmentId);

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/reports/weekly?${q.toString()}`, { cache: "no-store" });
  const payload = await res.json();

  return <WeeklyProgressReport data={payload?.success ? payload.data : null} error={payload?.success ? null : payload?.error ?? "Không thể tải báo cáo"} />;
}
