import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TaskSearch } from "@/components/tasks/task-search";
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
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-teal-700">Tasks</p>
            <h1 className="text-2xl font-semibold text-slate-900">Danh sách phòng</h1>
          </div>
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/tasks" className="hover:text-slate-900">Tasks</Link>
            <span>/</span>
            <span className="text-slate-900">Danh sách</span>
          </nav>
        </header>
        <TaskSearch />
        <TaskTable
          assignees={assignees.map(optionizePerson)}
          creators={creators.map(optionizePerson)}
          departments={departments.map((item) => ({ id: item.id, label: `${item.name} (${item.code})` }))}
          defaultFilters={{ month: new Date().toISOString().slice(0, 7) }}
        />
      </div>
    </main>
  );
}
