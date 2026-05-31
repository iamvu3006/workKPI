"use client";

import Link from "next/link";
import { 
  Clock, AlertTriangle, Tag, PlayCircle, Sparkles, 
  CheckCircle2, Circle, AlertCircle 
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks/constants";
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

const priorityTextColors: Record<string, string> = {
  LOW: "text-slate-500",
  NORMAL: "text-blue-600",
  HIGH: "text-amber-600",
  URGENT: "text-red-600 font-semibold",
};

interface TaskCardProps {
  task: TaskCardData;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TaskCard({ task, draggable, onDragStart }: TaskCardProps) {
  const isOverdue = task.isOverdue === true;

  // Smart Deadline logic
  const date = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(date);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let deadlineBadgeClass = "text-slate-500 bg-slate-50";
  let deadlineText = date.toLocaleDateString("vi-VN");
  let deadlineIcon = <Clock className="h-3 w-3 text-slate-400" />;

  if (isOverdue || diffDays < 0) {
    deadlineBadgeClass = "text-red-700 bg-red-50/70 border border-red-100 font-semibold animate-pulse";
    deadlineIcon = <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />;
    deadlineText = `Trễ ${Math.abs(diffDays)} ngày`;
  } else if (diffDays === 0) {
    deadlineBadgeClass = "text-amber-800 bg-amber-50 border border-amber-100 font-semibold";
    deadlineIcon = <Clock className="h-3 w-3 text-amber-600 shrink-0" />;
    deadlineText = "Hôm nay";
  } else if (diffDays === 1) {
    deadlineBadgeClass = "text-amber-700 bg-amber-50 font-medium";
    deadlineIcon = <Clock className="h-3 w-3 text-amber-500 shrink-0" />;
    deadlineText = "Ngày mai";
  } else if (diffDays <= 3) {
    deadlineBadgeClass = "text-amber-700 bg-amber-50";
    deadlineIcon = <Clock className="h-3 w-3 text-amber-500 shrink-0" />;
    deadlineText = `Còn ${diffDays} ngày`;
  }

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task.id)}
      className={cn(
        "cursor-grab rounded-2xl border border-slate-200 border-l-[6px] bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing transition-all duration-200 relative overflow-hidden group",
        priorityColors[task.priority] ?? "border-l-slate-300",
        isOverdue && "ring-1 ring-red-200 bg-red-50/10"
      )}
    >
      <Link href={`/dashboard/tasks/${task.id}`} className="block space-y-3">
        {/* Row 1: Title & Weight */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-teal-700 transition-colors">
            {task.title}
          </h3>
          <Badge variant="outline" className="shrink-0 text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200">
            {task.weight}%
          </Badge>
        </div>

        {/* Row 2: Tag Badges if any */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((t) => (
              <span
                key={`${task.id}-card-${t}`}
                className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500"
              >
                <Tag className="h-2 w-2 text-slate-400" />
                {t}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[9px] font-bold text-slate-400">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Priority & Smart Deadline */}
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span className={cn("font-medium capitalize", priorityTextColors[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          
          <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px]", deadlineBadgeClass)}>
            {deadlineIcon}
            {deadlineText}
          </span>
        </div>

        {/* Row 4: Assignee Avatar Group */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex items-center -space-x-1.5">
              {task.assignees.slice(0, 3).map((a) => (
                <Avatar
                  key={a.id}
                  initials={getInitials(a.name)}
                  size="sm"
                  title={a.name}
                  className="h-6 w-6 text-[9px] ring-2 ring-white border-transparent"
                />
              ))}
              {task.assignees.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-600 ring-2 ring-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Chờ phân công</span>
          )}

          {/* Inline progress text */}
          <span className="text-[10px] font-semibold text-slate-500">{task.progressPercent}%</span>
        </div>

        {/* Gradient Progress Bar at the bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-300"
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
      </Link>
    </article>
  );
}
