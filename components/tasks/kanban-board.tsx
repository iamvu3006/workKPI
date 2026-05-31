"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Circle, PlayCircle, AlertCircle, Sparkles, CheckCircle2,
  Plus, User, Search, Filter, Loader2, ArrowRight, X
} from "lucide-react";

import { SubmitReviewForm } from "@/components/tasks/submit-review-form";
import { TaskCard, type TaskCardData } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { KANBAN_COLUMNS, STATUS_LABELS } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  canCreate?: boolean;
}

const columnStyles: Record<string, { bg: string; border: string; headerText: string; accent: string; icon: React.ReactNode }> = {
  TO_DO: {
    bg: "bg-slate-50/70",
    border: "border-slate-200/80",
    headerText: "text-slate-700",
    accent: "bg-slate-200 text-slate-700",
    icon: <Circle className="h-4 w-4 text-slate-500" />
  },
  IN_PROGRESS: {
    bg: "bg-blue-50/30",
    border: "border-blue-200/30",
    headerText: "text-blue-800",
    accent: "bg-blue-100 text-blue-800",
    icon: <PlayCircle className="h-4 w-4 text-blue-600 animate-pulse" />
  },
  PENDING: {
    bg: "bg-amber-50/30",
    border: "border-amber-200/30",
    headerText: "text-amber-800",
    accent: "bg-amber-100 text-amber-800",
    icon: <AlertCircle className="h-4 w-4 text-amber-600" />
  },
  REVIEW: {
    bg: "bg-purple-50/30",
    border: "border-purple-200/30",
    headerText: "text-purple-800",
    accent: "bg-purple-100 text-purple-800",
    icon: <Sparkles className="h-4 w-4 text-purple-600" />
  },
  DONE: {
    bg: "bg-emerald-50/30",
    border: "border-emerald-200/30",
    headerText: "text-emerald-800",
    accent: "bg-emerald-100 text-emerald-800",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  }
};

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function KanbanBoard({ canCreate }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeDragOverCol, setActiveDragOverCol] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingReason, setPendingReason] = useState("");
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);

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

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setActiveDragOverCol(status);
  };

  const handleDragLeave = () => {
    setActiveDragOverCol(null);
  };

  const handleDrop = async (status: string, e: React.DragEvent) => {
    e.preventDefault();
    setActiveDragOverCol(null);
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) {
      setDraggingId(null);
      return;
    }

    if (status === "PENDING") {
      setPendingTaskId(taskId);
      setDraggingId(null);
      return;
    }

    if (status === "REVIEW") {
      setReviewTaskId(taskId);
      setDraggingId(null);
      return;
    }

    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, pendingBlockType: "OTHER" }),
    });
    const json = await res.json();
    if (json.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: json.data.status } : t))
      );
    } else {
      setPendingError(json.error || "Không thể đổi trạng thái");
      setTimeout(() => setPendingError(null), 4000);
    }
    setDraggingId(null);
  };

  // Compile unique assignees for premium Avatar filtering toolbar
  const allAssignees = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      (t.assignees ?? []).forEach((a) => {
        if (a.id && a.name) map.set(a.id, a.name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  function SkeletonBoard() {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <div key={`sk-col-${status}`} className="min-w-[282px] flex-1 rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4">
            <div className="mb-4 flex items-center justify-between animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-200"></div>
              <div className="h-5 w-8 rounded-full bg-slate-200"></div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={`sk-card-${status}-${idx}`} className="h-32 w-full rounded-2xl bg-white border border-slate-200 p-4 space-y-3 animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-slate-200"></div>
                  <div className="h-3 w-1/2 rounded bg-slate-100"></div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100"></div>
                    <div className="h-3 w-12 rounded bg-slate-100"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* SaaS Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        
        {/* Avatar Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Lọc Assignee:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* "Tất cả" Avatar Toggle */}
            <button
              onClick={() => setAssigneeFilter("")}
              className={cn(
                "flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold border transition-all cursor-pointer",
                assigneeFilter === ""
                  ? "bg-teal-50 border-teal-200 text-teal-800 shadow-sm font-bold ring-2 ring-teal-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              Tất cả
            </button>

            {/* Avatar buttons for employees */}
            {allAssignees.slice(0, 8).map((a) => {
              const active = assigneeFilter === a.id;
              return (
                <button
                  key={`filter-${a.id}`}
                  onClick={() => setAssigneeFilter(active ? "" : a.id)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all cursor-pointer relative",
                    active
                      ? "bg-teal-50 border-teal-200 text-teal-800 ring-2 ring-teal-500/20 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                  title={a.name}
                >
                  <Avatar
                    initials={getInitials(a.name)}
                    size="sm"
                    className="h-5 w-5 text-[8px] border-none font-bold"
                  />
                  <span className="max-w-[80px] truncate text-[11px]">{a.name}</span>
                </button>
              );
            })}
            
            {allAssignees.length > 8 && (
              <select
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-600 focus:border-teal-500 outline-none"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="">Thành viên khác...</option>
                {allAssignees.slice(8).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Action Button: Create Task */}
        {canCreate && (
          <Button asChild className="h-10 rounded-xl px-4 font-semibold shadow-sm hover:scale-[1.02] active:scale-95 transition-all">
            <Link href="/dashboard/tasks/new" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Tạo công việc</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Global Error Banner */}
      {pendingError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700 shadow-sm animate-pulse flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{pendingError}</span>
        </div>
      )}

      {/* Kanban Columns */}
      {loading ? (
        <SkeletonBoard />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {KANBAN_COLUMNS.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            const style = columnStyles[status] || columnStyles.TO_DO;
            const isDragOver = activeDragOverCol === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(status, e)}
                className={cn(
                  "min-w-[282px] flex-1 rounded-2xl border bg-slate-50/80 p-4 transition-all duration-200 snap-start flex flex-col max-h-[80vh]",
                  style.bg,
                  style.border,
                  isDragOver && "border-dashed border-2 border-teal-400 bg-teal-50/30 scale-[1.01] shadow-md"
                )}
              >
                {/* Column Header */}
                <header className="mb-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    {style.icon}
                    <h2 className={cn("text-[13px] font-bold uppercase tracking-wider", style.headerText)}>
                      {STATUS_LABELS[status]}
                    </h2>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold shadow-sm border border-slate-100", style.accent)}>
                    {columnTasks.length}
                  </span>
                </header>

                {/* Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 -mr-2 max-h-[68vh] min-h-[150px]">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[120px] rounded-xl border border-dashed border-slate-200/60 bg-white/20 p-4">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Kéo thả vào đây</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        draggable
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Premium Backdrop-blur Modals */}
      
      {/* 1. Pending Reason Dialog */}
      {pendingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo công việc Pending</h3>
                <p className="text-xs text-slate-500">Mô tả lý do vướng mắc của công việc này.</p>
              </div>
            </div>

            {pendingError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-pulse">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pendingError}</span>
              </div>
            )}

            <textarea
              value={pendingReason}
              onChange={(e) => setPendingReason(e.target.value)}
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 min-h-[100px]"
              rows={4}
              placeholder="Ví dụ: Đang đợi tài liệu kỹ thuật từ phòng ban liên quan (tối thiểu 10 ký tự)..."
            />
            
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => { setPendingTaskId(null); setPendingReason(""); setPendingError(null); }}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                disabled={pendingReason.trim().length < 10 || pendingLoading}
                onClick={async () => {
                  if (!pendingTaskId) return;
                  setPendingLoading(true);
                  const res = await fetch(`/api/tasks/${pendingTaskId}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "PENDING", reason: pendingReason, pendingBlockType: "OTHER" }),
                  });
                  const json = await res.json();
                  setPendingLoading(false);
                  if (json.success) {
                    setTasks((prev) => prev.map((t) => (t.id === pendingTaskId ? { ...t, status: json.data.status } : t)));
                    setPendingTaskId(null);
                    setPendingReason("");
                    setPendingError(null);
                  } else {
                    setPendingError(json.error || "Không thể đổi trạng thái");
                  }
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-40 shadow-sm transition-all"
              >
                {pendingLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <span>Xác nhận</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Submit Review Form Modal */}
      {reviewTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <SubmitReviewForm
              taskId={reviewTaskId}
              hasAttachments={false}
              defaultOpen={true}
              onCancel={() => {
                setReviewTaskId(null);
              }}
              onSuccess={() => {
                setTasks((prev) =>
                  prev.map((t) => (t.id === reviewTaskId ? { ...t, status: "REVIEW" } : t))
                );
                setReviewTaskId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
