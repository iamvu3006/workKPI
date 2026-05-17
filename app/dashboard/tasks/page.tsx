import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { KanbanBoard } from "@/components/tasks/kanban-board";
import { WeightProgressBar } from "@/components/tasks/weight-progress-bar";
import { prisma } from "@/lib/db/prisma";
import { canCreateTask } from "@/lib/tasks/permissions";
import { getAssigneeMonthlyWeight } from "@/lib/tasks/weight";
import { createClient } from "@/utils/supabase/server";

export default async function TasksKanbanPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, departmentId: true },
  });
  if (!profile) redirect("/auth/login");

  const now = new Date();
  const weightTotal = await getAssigneeMonthlyWeight(
    profile.id,
    now.getFullYear(),
    now.getMonth() + 1
  );

  const canCreate = canCreateTask({
    id: profile.id,
    role: profile.role,
    departmentId: profile.departmentId,
    teamId: null,
  });

  const isManager = profile.role === "MANAGER" || profile.role === "ADMIN";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-teal-700">Tasks</p>
            <h1 className="text-2xl font-semibold text-slate-900">Kanban Board</h1>
          </div>
          <nav className="flex gap-3 text-sm">
            {isManager && (
              <Link href="/dashboard/tasks/list" className="text-teal-700 hover:underline">
                List view
              </Link>
            )}
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-800">
              Dashboard
            </Link>
          </nav>
        </header>

        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-4">
          <WeightProgressBar total={weightTotal} />
        </div>

        <KanbanBoard canCreate={canCreate} />
      </div>
    </main>
  );
}
