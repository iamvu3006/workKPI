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
    select: { role: true },
  });

  if (!profile || !["MANAGER", "LEADER", "ADMIN", "DIRECTOR"].includes(profile.role)) {
    redirect("/dashboard/tasks");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-teal-700">Tasks</p>
            <h1 className="text-2xl font-semibold text-slate-900">Danh sách phòng</h1>
          </div>
          <Link href="/dashboard/tasks" className="text-sm text-teal-700 hover:underline">
            ← Kanban
          </Link>
        </header>
        <TaskTable />
      </div>
    </main>
  );
}
