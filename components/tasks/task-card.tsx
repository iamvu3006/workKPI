"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

export interface TaskCardData {
  id: string;
  title: string;
  status: string;
  priority: keyof typeof PRIORITY_LABELS;
  weight: number;
  deadline: string;
  progressPercent: number;
  isOverdue?: boolean;
  assignees?: { id: string; name: string }[];
  tags?: string[];
}

const priorityColors: Record<string, string> = {
  LOW: "border-l-slate-300",
  NORMAL: "border-l-blue-400",
  HIGH: "border-l-amber-500",
  URGENT: "border-l-red-500",
};

interface TaskCardProps {
  task: TaskCardData;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export function TaskCard({ task, draggable, onDragStart }: TaskCardProps) {
  return (
    <article
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task.id)}
      className={cn(
        "cursor-grab rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        priorityColors[task.priority] ?? "border-l-slate-300",
        task.isOverdue && "ring-1 ring-red-200"
      )}
    >
      <Link href={`/dashboard/tasks/${task.id}`} className="block space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {task.title}
          </h3>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {task.weight}%
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
          <span>{PRIORITY_LABELS[task.priority]}</span>
          <span>·</span>
          <span className={task.isOverdue ? "font-medium text-red-600" : ""}>
            {new Date(task.deadline).toLocaleDateString("vi-VN")}
          </span>
        </div>
        {task.assignees && task.assignees.length > 0 && (
          <p className="truncate text-xs text-slate-500">
            {task.assignees.map((a) => a.name).join(", ")}
          </p>
        )}
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
      </Link>
    </article>
  );
}
