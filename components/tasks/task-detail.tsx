"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Checklist } from "@/components/tasks/checklist";
import { ReviewForm } from "@/components/tasks/review-form";
import { SubtaskList } from "@/components/tasks/subtask-list";
import { TaskActions } from "@/components/tasks/task-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks/constants";

interface TaskDetailProps {
  taskId: string;
  currentUserId: string;
  canEdit: boolean;
}

export function TaskDetail({ taskId, currentUserId, canEdit }: TaskDetailProps) {
  const router = useRouter();
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    const json = await res.json();
    if (json.success) setTask(json.data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error);
  };

  if (loading) return <p className="text-slate-500">Đang tải...</p>;
  if (!task) return <p className="text-red-600">Task không tồn tại</p>;

  const assignees = (task.assignees as { id: string; name: string }[]) ?? [];
  const isAssignee = assignees.some((a) => a.id === currentUserId);
  const status = task.status as keyof typeof STATUS_LABELS;
  const priority = task.priority as keyof typeof PRIORITY_LABELS;
  const history = (task.statusHistory as {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
    actor: { displayName?: string; fullName?: string };
  }[]) ?? [];
  const attachments = (task.attachments as { id: string; fileName: string; fileUrl: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{STATUS_LABELS[status]}</Badge>
            <Badge variant="outline">{PRIORITY_LABELS[priority]}</Badge>
            <Badge variant="outline">{task.weight as number}%</Badge>
            {task.isOverdue && <Badge className="bg-red-100 text-red-700">Overdue</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{task.title as string}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deadline: {new Date(task.deadline as string).toLocaleDateString("vi-VN")} · Tiến độ:{" "}
            {task.progressPercent as number}%
          </p>
        </div>
        {canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/tasks/${taskId}/edit`}>Chỉnh sửa</Link>
          </Button>
        )}
      </header>

      {task.description && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Mô tả</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{task.description as string}</p>
        </section>
      )}

      <TaskActions
        taskId={taskId}
        status={status}
        isAssignee={isAssignee}
        onUpdated={() => {
          load();
          router.refresh();
        }}
      />

      {status === "REVIEW" && canEdit && (
        <ReviewForm
          taskId={taskId}
          taskTitle={task.title as string}
          deadline={task.deadline as string}
          selfAssessment={(task.selfAssessment as any) || undefined}
          onSuccess={() => {
            load();
            router.refresh();
          }}
        />
      )}

      {!task.parentTaskId && <SubtaskList parentTaskId={taskId} />}
      <Checklist taskId={taskId} readOnly={!isAssignee && !canEdit} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">File đính kèm</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {attachments.map((a) => (
            <li key={a.id}>
              <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                {a.fileName}
              </a>
            </li>
          ))}
        </ul>
        {(isAssignee || canEdit) && (
          <input type="file" className="mt-3 text-sm" onChange={uploadFile} />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Lịch sử thay đổi</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {history.map((h) => (
            <li key={h.id} className="border-b border-slate-50 pb-2">
              <span className="font-medium">
                {h.fromStatus ?? "—"} → {h.toStatus}
              </span>
              <span className="text-slate-500">
                {" "}
                · {new Date(h.createdAt).toLocaleString("vi-VN")}
              </span>
              {h.reason && <p className="text-slate-600">{h.reason}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
