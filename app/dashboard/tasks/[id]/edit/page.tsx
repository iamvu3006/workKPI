import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TaskForm } from "@/components/tasks/task-form";
import { prisma } from "@/lib/db/prisma";
import { loadDepartmentAssignees } from "@/lib/tasks/load-assignees";
import { canEditTaskMetadata } from "@/lib/tasks/permissions";
import { createClient } from "@/utils/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTaskPage({ params }: PageProps) {
  const { id } = await params;
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

  const task = await prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: { assignees: true },
  });
  if (!task || !canEditTaskMetadata(task, profile)) {
    redirect(`/dashboard/tasks/${id}`);
  }

  const assignees = await loadDepartmentAssignees(task.departmentId);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Chỉnh sửa task</h1>
        <TaskForm
          mode="edit"
          assignees={assignees}
          departmentId={task.departmentId}
          initial={{
            id: task.id,
            title: task.title,
            description: task.description ?? undefined,
            deadline: task.deadline.toISOString(),
            weight: task.weight,
            priority: task.priority,
            tags: task.tags,
            assigneeIds: task.assignees.map((a) => a.assigneeId),
          }}
        />
      </div>
    </main>
  );
}
