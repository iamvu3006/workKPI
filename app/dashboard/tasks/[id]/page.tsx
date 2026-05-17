import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TaskDetail } from "@/components/tasks/task-detail";
import { prisma } from "@/lib/db/prisma";
import { canEditTaskMetadata } from "@/lib/tasks/permissions";
import { createClient } from "@/utils/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function TaskDetailPage({ params }: PageProps) {
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
  if (!task) redirect("/dashboard/tasks");

  const canEdit = canEditTaskMetadata(task, profile);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/tasks" className="text-sm text-teal-700 hover:underline">
          ← Kanban
        </Link>
        <div className="mt-4">
          <TaskDetail taskId={id} currentUserId={profile.id} canEdit={canEdit} />
        </div>
      </div>
    </main>
  );
}
