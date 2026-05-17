import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TaskForm } from "@/components/tasks/task-form";
import { prisma } from "@/lib/db/prisma";
import { loadDepartmentAssignees } from "@/lib/tasks/load-assignees";
import { canCreateTask } from "@/lib/tasks/permissions";
import { createClient } from "@/utils/supabase/server";

export default async function NewTaskPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, departmentId: true, teamId: true },
  });
  if (!profile) redirect("/auth/login");

  if (!canCreateTask(profile)) redirect("/dashboard/tasks");

  const assignees = await loadDepartmentAssignees(profile.departmentId);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Tạo task mới</h1>
        <TaskForm
          mode="create"
          assignees={assignees}
          departmentId={profile.departmentId ?? undefined}
        />
      </div>
    </main>
  );
}
