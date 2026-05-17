"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

import type { TaskCardData } from "./task-card";

export function TaskTable() {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100", month });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/tasks?${params}`);
    const json = await res.json();
    if (json.success) setTasks(json.data);
    setLoading(false);
  }, [statusFilter, month]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ưu tiên</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Weight</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Đang tải...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Không có task
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className={cn(
                    "border-b border-slate-50 hover:bg-slate-50/50",
                    task.isOverdue && "bg-red-50/50"
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.assignees?.map((a) => a.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}</Badge>
                  </td>
                  <td className="px-4 py-3">{PRIORITY_LABELS[task.priority]}</td>
                  <td
                    className={cn(
                      "px-4 py-3",
                      task.isOverdue && "font-semibold text-red-600"
                    )}
                  >
                    {new Date(task.deadline).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">{task.weight}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
