import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

type Props = {
  searchParams?: Promise<{
    period?: string;
  }> | {
    period?: string;
  };
};

function normalizePeriod(period?: string) {
  if (period === "week" || period === "month" || period === "quarter" || period === "year") {
    return period;
  }
  return "month";
}

export default async function ReportsEntryPage({ searchParams }: Props) {
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

  const period = normalizePeriod(params.period);

  if (profile.role === "EMPLOYEE" || profile.role === "LEADER") {
    const progressPeriod = period === "week" ? "week" : period;
    redirect(`/dashboard/reports/weekly?period=${progressPeriod}`);
  }

  if (profile.role === "MANAGER") {
    const managerPeriod = period === "week" ? "month" : period;
    redirect(`/dashboard/reports/monthly?period=${managerPeriod}`);
  }

  if (profile.role === "DIRECTOR" || profile.role === "ADMIN") {
    const companyPeriod = period === "week" ? "month" : period;
    redirect(`/dashboard/reports/company?period=${companyPeriod}`);
  }

  redirect("/dashboard");
}
