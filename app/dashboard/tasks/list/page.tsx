import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TaskTable } from "@/components/tasks/task-table";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

export default async function TasksListPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, departmentId: true, teamId: true },
  });

  if (!profile || !["MANAGER", "LEADER", "ADMIN", "DIRECTOR"].includes(profile.role)) {
    redirect("/dashboard/tasks");
  }

  const peopleWhere =
    profile.role === "DIRECTOR" || profile.role === "ADMIN"
      ? { status: "ACTIVE" as const }
      : profile.role === "MANAGER" && profile.departmentId
        ? { status: "ACTIVE" as const, departmentId: profile.departmentId }
        : profile.teamId
          ? { status: "ACTIVE" as const, teamId: profile.teamId }
          : { status: "ACTIVE" as const };

  const [assignees, creators, departments] = await Promise.all([
    prisma.profile.findMany({
      where: peopleWhere,
      select: { id: true, displayName: true, fullName: true, email: true },
      orderBy: [{ displayName: "asc" }, { fullName: "asc" }],
    }),
    prisma.profile.findMany({
      where: peopleWhere,
      select: { id: true, displayName: true, fullName: true, email: true },
      orderBy: [{ displayName: "asc" }, { fullName: "asc" }],
    }),
    profile.role === "DIRECTOR" || profile.role === "ADMIN"
      ? prisma.department.findMany({
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        })
      : profile.departmentId
        ? prisma.department.findMany({
            where: { id: profile.departmentId },
            select: { id: true, name: true, code: true },
          })
        : Promise.resolve([]),
  ]);

  const optionizePerson = (item: { id: string; displayName: string | null; fullName: string | null; email: string }) => ({
    id: item.id,
    label: item.displayName || item.fullName || item.email,
  });

  return (
    <div className="space-y-5">
      {/* SaaS Premium Header Wrapper */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Tasks</p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Danh sách công việc phòng ban</h1>
        </div>
        <nav className="flex items-center gap-3 text-xs font-semibold">
          <Link href="/dashboard/tasks" className="text-teal-700 hover:text-teal-800 border-r border-slate-200 pr-3">
            Bảng Kanban (Kanban Board)
          </Link>
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-800">
            Tổng quan
          </Link>
        </nav>
      </header>

      <TaskTable
        assignees={assignees.map(optionizePerson)}
        creators={creators.map(optionizePerson)}
        departments={departments.map((item) => ({ id: item.id, label: `${item.name} (${item.code})` }))}
        defaultFilters={{ month: new Date().toISOString().slice(0, 7) }}
      />
    </div>
  );
}
