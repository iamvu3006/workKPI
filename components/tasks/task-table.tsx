"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

import type { TaskCardData } from "./task-card";

type Option = { id: string; label: string };

type TaskFilters = {
  month: string;
  status: string;
  priority: string;
  assigneeId: string;
  creatorId: string;
  departmentId: string;
  tag: string;
  deadlineFrom: string;
  deadlineTo: string;
  weightMin: string;
  weightMax: string;
  sortBy: string;
  sortDir: "asc" | "desc";
};

type TaskTableProps = {
  assignees: Option[];
  creators: Option[];
  departments: Option[];
  defaultFilters?: Partial<TaskFilters>;
};

type FilterPreset = {
  id: string;
  name: string;
  filters: TaskFilters;
  createdAt: string;
};

function getDefaultFilters(defaultFilters?: Partial<TaskFilters>): TaskFilters {
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  return {
    month: defaultFilters?.month ?? month,
    status: defaultFilters?.status ?? "",
    priority: defaultFilters?.priority ?? "",
    assigneeId: defaultFilters?.assigneeId ?? "",
    creatorId: defaultFilters?.creatorId ?? "",
    departmentId: defaultFilters?.departmentId ?? "",
    tag: defaultFilters?.tag ?? "",
    deadlineFrom: defaultFilters?.deadlineFrom ?? "",
    deadlineTo: defaultFilters?.deadlineTo ?? "",
    weightMin: defaultFilters?.weightMin ?? "",
    weightMax: defaultFilters?.weightMax ?? "",
    sortBy: defaultFilters?.sortBy ?? "deadline",
    sortDir: defaultFilters?.sortDir ?? "asc",
  };
}

function normalizeFilters(value: unknown, fallback: TaskFilters): TaskFilters {
  if (!value || typeof value !== "object") return fallback;

  const row = value as Record<string, unknown>;
  return {
    month: typeof row.month === "string" ? row.month : fallback.month,
    status: typeof row.status === "string" ? row.status : fallback.status,
    priority: typeof row.priority === "string" ? row.priority : fallback.priority,
    assigneeId: typeof row.assigneeId === "string" ? row.assigneeId : fallback.assigneeId,
    creatorId: typeof row.creatorId === "string" ? row.creatorId : fallback.creatorId,
    departmentId: typeof row.departmentId === "string" ? row.departmentId : fallback.departmentId,
    tag: typeof row.tag === "string" ? row.tag : fallback.tag,
    deadlineFrom: typeof row.deadlineFrom === "string" ? row.deadlineFrom : fallback.deadlineFrom,
    deadlineTo: typeof row.deadlineTo === "string" ? row.deadlineTo : fallback.deadlineTo,
    weightMin: typeof row.weightMin === "string" ? row.weightMin : fallback.weightMin,
    weightMax: typeof row.weightMax === "string" ? row.weightMax : fallback.weightMax,
    sortBy: typeof row.sortBy === "string" ? row.sortBy : fallback.sortBy,
    sortDir: row.sortDir === "asc" ? "asc" : "desc",
  };
}

export function TaskTable({ assignees, creators, departments, defaultFilters }: TaskTableProps) {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const fallbackFilters = useMemo(() => getDefaultFilters(defaultFilters), [defaultFilters]);
  const [filters, setFilters] = useState<TaskFilters>(fallbackFilters);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");

  useEffect(() => {
    async function loadPresets() {
      try {
        const response = await fetch("/api/users/me/saved-filters");
        const json = await response.json();
        if (!json?.success || !Array.isArray(json.data)) {
          setPresets([]);
          return;
        }

        const mapped = (json.data as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
          createdAt: String(item.createdAt ?? ""),
          filters: normalizeFilters(item.filters, fallbackFilters),
        }));

        setPresets(mapped.filter((item) => item.id && item.name));
      } catch {
        setPresets([]);
      }
    }

    loadPresets();
  }, [fallbackFilters]);

  const updateFilter = useCallback(<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });

      Object.entries(filters).forEach(([key, value]) => {
        if (value === "") return;
        params.set(key, String(value));
      });

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: "Tất cả trạng thái" },
      ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    ],
    []
  );

  const priorityOptions = useMemo(
    () => [
      { value: "", label: "Tất cả mức ưu tiên" },
      ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
    ],
    []
  );

  function clearAll() {
    setFilters(fallbackFilters);
    setSelectedPreset("");
  }

  async function saveCurrentPreset() {
    const name = window.prompt("Tên bộ lọc muốn lưu");
    if (!name) return;

    const normalizedName = name.trim();
    if (normalizedName.length < 2) return;

    try {
      const response = await fetch("/api/users/me/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, filters }),
      });
      const json = await response.json();

      if (!json?.success || !json.data) return;

      const nextPreset: FilterPreset = {
        id: String(json.data.id),
        name: String(json.data.name),
        createdAt: String(json.data.createdAt),
        filters: normalizeFilters(json.data.filters, fallbackFilters),
      };

      const next = [nextPreset, ...presets.filter((preset) => preset.name !== nextPreset.name)].slice(
        0,
        10
      );
      setPresets(next);
      setSelectedPreset(nextPreset.id);
    } catch {
      // ignore save errors to keep list view usable
    }
  }

  async function deleteSelectedPreset() {
    if (!selectedPreset) return;

    try {
      await fetch(`/api/users/me/saved-filters/${selectedPreset}`, {
        method: "DELETE",
      });
      setPresets((current) => current.filter((item) => item.id !== selectedPreset));
      setSelectedPreset("");
    } catch {
      // ignore delete errors
    }
  }

  function applyPreset(id: string) {
    setSelectedPreset(id);
    if (!id) return;

    const preset = presets.find((item) => item.id === id);
    if (preset) {
      setFilters(preset.filters);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <Input
            label="Tháng"
            type="month"
            value={filters.month}
            onChange={(e) => updateFilter("month", e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all-status"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ưu tiên</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.priority}
              onChange={(e) => updateFilter("priority", e.target.value)}
            >
              {priorityOptions.map((option) => (
                <option key={option.value || "all-priority"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Phòng ban</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.departmentId}
              onChange={(e) => updateFilter("departmentId", e.target.value)}
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Assignee</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.assigneeId}
              onChange={(e) => updateFilter("assigneeId", e.target.value)}
            >
              <option value="">Tất cả assignee</option>
              {assignees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Người tạo</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.creatorId}
              onChange={(e) => updateFilter("creatorId", e.target.value)}
            >
              <option value="">Tất cả người tạo</option>
              {creators.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Tag"
            value={filters.tag}
            onChange={(e) => updateFilter("tag", e.target.value)}
            placeholder="Ví dụ: sales"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Deadline từ"
              type="date"
              value={filters.deadlineFrom}
              onChange={(e) => updateFilter("deadlineFrom", e.target.value)}
            />
            <Input
              label="Deadline đến"
              type="date"
              value={filters.deadlineTo}
              onChange={(e) => updateFilter("deadlineTo", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Weight từ"
              type="number"
              min={0}
              max={100}
              value={filters.weightMin}
              onChange={(e) => updateFilter("weightMin", e.target.value)}
            />
            <Input
              label="Weight đến"
              type="number"
              min={0}
              max={100}
              value={filters.weightMax}
              onChange={(e) => updateFilter("weightMax", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Sắp xếp</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
            >
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Created</option>
              <option value="updatedAt">Updated</option>
              <option value="weight">Weight</option>
              <option value="progressPercent">Progress %</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Thứ tự</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filters.sortDir}
              onChange={(e) => updateFilter("sortDir", e.target.value as TaskFilters["sortDir"])}
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Bộ lọc đã lưu</label>
            <select
              className="h-11 w-64 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
            >
              <option value="">Chọn preset</option>
              {presets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="secondary" onClick={saveCurrentPreset}>
            Lưu bộ lọc
          </Button>
          <Button type="button" variant="ghost" onClick={deleteSelectedPreset} disabled={!selectedPreset}>
            Xóa preset
          </Button>
          <Button type="button" variant="ghost" onClick={clearAll}>
            Xóa bộ lọc
          </Button>
        </div>
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
