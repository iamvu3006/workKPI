"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { TaskCard, type TaskCardData } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { KANBAN_COLUMNS, STATUS_LABELS } from "@/lib/tasks/constants";

interface KanbanBoardProps {
  canCreate?: boolean;
}

export function KanbanBoard({ canCreate }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (assigneeFilter) params.set("assigneeId", assigneeFilter);
    const res = await fetch(`/api/tasks?${params}`);
    const json = await res.json();
    if (json.success) setTasks(json.data);
    setLoading(false);
  }, [assigneeFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggingId(taskId);
  };

  const handleDrop = async (status: string, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) {
      setDraggingId(null);
      return;
    }

    let reason: string | undefined;
    if (status === "PENDING") {
      reason = window.prompt("Nhập lý do vướng mắc:") ?? undefined;
      if (!reason || reason.length < 10) {
        setDraggingId(null);
        return;
      }
    }

    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason, pendingBlockType: "OTHER" }),
    });
    const json = await res.json();
    if (json.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: json.data.status } : t))
      );
    } else {
      alert(json.error || "Không thể đổi trạng thái");
    }
    setDraggingId(null);
  };

  const assigneeOptions = Array.from(
    new Map(
      tasks.flatMap((t) => (t.assignees ?? []).map((a) => [a.id, a.name]))
    ).entries()
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">Tất cả assignee</option>
          {assigneeOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/tasks/new">+ Tạo task</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div
                key={status}
                className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(status, e)}
              >
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">
                    {STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
                    {columnTasks.length}
                  </span>
                </header>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      draggable
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
