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
    <div className="space-y-5">
      {/* Simplified header wrapper */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Tasks</p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Bảng Kanban Board</h1>
        </div>
        <nav className="flex items-center gap-3 text-xs font-semibold">
          {isManager && (
            <Link href="/dashboard/tasks/list" className="text-teal-700 hover:text-teal-800 border-r border-slate-200 pr-3">
              Chuyển sang dạng Bảng (List view)
            </Link>
          )}
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-800">
            Tổng quan
          </Link>
        </nav>
      </header>

      {/* Weight Widget đặt ngang thanh thoát phía trên Kanban Board */}
      {/* <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm max-w-md">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Trọng số tháng của bạn</p>
        <WeightProgressBar total={weightTotal} />
      </div> */}

      {/* Kanban Board tràn viền rộng rãi */}
      <div className="min-w-0">
        <KanbanBoard canCreate={canCreate} />
      </div>
    </div>
  );
}
