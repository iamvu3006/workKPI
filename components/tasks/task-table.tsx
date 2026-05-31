"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Circle, PlayCircle, AlertCircle, Sparkles, CheckCircle2,
  ChevronDown, ChevronUp, ChevronsUp, Minus,
  Search, Filter, Calendar, Save, Trash2, RotateCcw,
  AlertTriangle, Tag, User, X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
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

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TaskTable({ assignees, creators, departments, defaultFilters }: TaskTableProps) {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const fallbackFilters = useMemo(() => getDefaultFilters(defaultFilters), [defaultFilters]);
  const [filters, setFilters] = useState<TaskFilters>(fallbackFilters);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");

  // Premium UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [quickTab, setQuickTab] = useState<"ALL" | "IN_PROGRESS" | "REVIEW" | "DONE" | "OVERDUE">("ALL");

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

  // Debounced search query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const updateFilter = useCallback(<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const isSearch = debouncedSearchQuery.trim().length >= 3;
      const url = isSearch ? "/api/tasks/search" : "/api/tasks";
      
      const params = new URLSearchParams();
      if (!isSearch) {
        params.set("limit", "100");
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value === "") return;
          params.set(key, String(value));
        });

        // Override status based on quickTab
        if (quickTab !== "ALL" && quickTab !== "OVERDUE") {
          params.set("status", quickTab);
        } else if (quickTab === "OVERDUE") {
          params.delete("status"); // fetch all then filter on client
        }
      } else {
        // Debounced text search API
        params.set("q", debouncedSearchQuery.trim());
        params.set("limit", "50");
        
        if (quickTab !== "ALL" && quickTab !== "OVERDUE") {
          params.set("status", quickTab);
        } else {
          if (filters.status) params.set("status", filters.status);
        }
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
        if (filters.tag) params.set("tag", filters.tag);
        if (filters.deadlineFrom) params.set("from", filters.deadlineFrom);
        if (filters.deadlineTo) params.set("to", filters.deadlineTo);
      }

      const res = await fetch(`${url}?${params.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        let data = isSearch ? (json.data?.data || []) : (json.data || []);
        
        if (quickTab === "OVERDUE") {
          data = data.filter((task: TaskCardData) => task.isOverdue === true);
        }
        
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearchQuery, quickTab]);

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
    setSearchQuery("");
    setQuickTab("ALL");
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

  // --- Render Helpers for Visuals ---

  function renderStatusBadge(status: string) {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    switch (status) {
      case "TO_DO":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/10">
            <Circle className="h-3.5 w-3.5 text-slate-400" />
            {label}
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            <PlayCircle className="h-3.5 w-3.5 animate-pulse text-blue-500" />
            {label}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/10">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            {label}
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            {label}
          </span>
        );
      case "DONE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {label}
          </span>
        );
      default:
        return <span className="text-xs">{label}</span>;
    }
  }

  function renderPriorityBadge(priority: string) {
    const label = PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority;
    switch (priority) {
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
            <ChevronsUp className="h-3.5 w-3.5 text-red-600 animate-bounce" />
            {label}
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-600/20">
            <ChevronUp className="h-3.5 w-3.5 text-orange-600" />
            {label}
          </span>
        );
      case "NORMAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Minus className="h-3.5 w-3.5 text-blue-500" />
            {label}
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-600/20">
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            {label}
          </span>
        );
      default:
        return <span className="text-xs">{label}</span>;
    }
  }

  function renderDeadline(deadlineStr: string, isOverdue?: boolean) {
    const date = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(date);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let badgeClass = "text-slate-600 bg-slate-100 border-slate-200";
    let text = date.toLocaleDateString("vi-VN");
    let hint = "";
    let icon = null;

    if (isOverdue || diffDays < 0) {
      badgeClass = "text-red-700 bg-red-50 border-red-200 font-semibold";
      icon = <AlertTriangle className="h-3 w-3 text-red-600 inline mr-1 shrink-0" />;
      hint = `Trễ ${Math.abs(diffDays)} ngày`;
    } else if (diffDays === 0) {
      badgeClass = "text-amber-800 bg-amber-50 border-amber-200 font-semibold";
      icon = <AlertCircle className="h-3 w-3 text-amber-600 inline mr-1 shrink-0" />;
      hint = "Hôm nay";
    } else if (diffDays === 1) {
      badgeClass = "text-amber-700 bg-amber-50 border-amber-100 font-medium";
      hint = "Ngày mai";
    } else if (diffDays <= 3) {
      badgeClass = "text-amber-700 bg-amber-50 border-amber-100";
      hint = `Còn ${diffDays} ngày`;
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-slate-700">{text}</span>
        {hint && (
          <span className={`inline-flex max-w-fit items-center rounded border px-1.5 py-0.5 text-[10px] ${badgeClass}`}>
            {icon}
            {hint}
          </span>
        )}
      </div>
    );
  }

  function renderProgressAndWeight(weight: number, progressPercent: number) {
    return (
      <div className="flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-teal-800">{weight}% Weight</span>
          <span className="text-slate-500 font-medium">{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  function TableSkeleton() {
    return (
      <>
        {Array.from({ length: 5 }).map((_, idx) => (
          <tr key={`skeleton-${idx}`} className="border-b border-slate-100 animate-pulse">
            <td className="px-4 py-4">
              <div className="h-4 w-48 rounded bg-slate-200 mb-2 animate-pulse"></div>
              <div className="h-3 w-20 rounded bg-slate-100 animate-pulse"></div>
            </td>
            <td className="px-4 py-4">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse"></div>
                <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse"></div>
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="h-6 w-20 rounded-full bg-slate-200 animate-pulse"></div>
            </td>
            <td className="px-4 py-4">
              <div className="h-6 w-24 rounded-full bg-slate-200 animate-pulse"></div>
            </td>
            <td className="px-4 py-4">
              <div className="h-4 w-16 rounded bg-slate-200 mb-1 animate-pulse"></div>
              <div className="h-3 w-12 rounded bg-slate-100 animate-pulse"></div>
            </td>
            <td className="px-4 py-4">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse"></div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.month !== fallbackFilters.month) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.departmentId) count++;
    if (filters.assigneeId) count++;
    if (filters.creatorId) count++;
    if (filters.tag) count++;
    if (filters.deadlineFrom) count++;
    if (filters.deadlineTo) count++;
    if (filters.weightMin) count++;
    if (filters.weightMax) count++;
    return count;
  }, [filters, fallbackFilters]);

  return (
    <div className="space-y-4">
      {/* SaaS Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        
        {/* Left Toolbar Side: Search and Tabs */}
        <div className="flex flex-col flex-1 gap-3 md:flex-row md:items-center">
          {/* Debounced Search */}
          <div className="relative md:w-72">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-50 p-1">
            <button
              onClick={() => setQuickTab("ALL")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                quickTab === "ALL" 
                  ? "bg-white text-teal-800 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setQuickTab("IN_PROGRESS")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                quickTab === "IN_PROGRESS" 
                  ? "bg-white text-teal-800 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Đang làm
            </button>
            <button
              onClick={() => setQuickTab("REVIEW")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                quickTab === "REVIEW" 
                  ? "bg-white text-teal-800 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Cần duyệt
            </button>
            <button
              onClick={() => setQuickTab("DONE")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                quickTab === "DONE" 
                  ? "bg-white text-teal-800 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Đã xong
            </button>
            <button
              onClick={() => setQuickTab("OVERDUE")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                quickTab === "OVERDUE" 
                  ? "bg-red-50 text-red-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Trễ hạn
            </button>
          </div>
        </div>

        {/* Right Toolbar Side: Filters Expander & Reset */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={cn(
              "h-11 gap-2 rounded-xl transition-all border-slate-200",
              isFiltersExpanded && "bg-teal-50 border-teal-200 text-teal-700"
            )}
          >
            <Filter className="h-4 w-4" />
            Bộ lọc nâng cao
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={clearAll}
            className="h-11 w-11 rounded-xl p-0 border border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-800"
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collapsible Filters Panel */}
      <div 
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isFiltersExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            
            {/* Filter: Month */}
            <Input
              label="Tháng"
              type="month"
              value={filters.month}
              onChange={(e) => updateFilter("month", e.target.value)}
            />

            {/* Filter: Status (Only shown if quickTab is ALL) */}
            {quickTab === "ALL" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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
            )}

            {/* Filter: Priority */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ưu tiên</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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

            {/* Filter: Department */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phòng ban</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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

            {/* Filter: Assignee */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assignee</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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

            {/* Filter: Creator */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Người tạo</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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

            {/* Filter: Tag */}
            <Input
              label="Tag"
              value={filters.tag}
              onChange={(e) => updateFilter("tag", e.target.value)}
              placeholder="Ví dụ: sales"
            />

            {/* Filter: Deadline Range */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Hạn từ"
                type="date"
                value={filters.deadlineFrom}
                onChange={(e) => updateFilter("deadlineFrom", e.target.value)}
              />
              <Input
                label="Hạn đến"
                type="date"
                value={filters.deadlineTo}
                onChange={(e) => updateFilter("deadlineTo", e.target.value)}
              />
            </div>

            {/* Filter: Weight Range */}
            <div className="grid grid-cols-2 gap-2">
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

            {/* Filter: Sort By */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sắp xếp</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                value={filters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value)}
              >
                <option value="deadline">Hạn chót (Deadline)</option>
                <option value="priority">Độ ưu tiên</option>
                <option value="createdAt">Ngày tạo</option>
                <option value="updatedAt">Ngày cập nhật</option>
                <option value="weight">Trọng số</option>
                <option value="progressPercent">Tiến độ (%)</option>
              </select>
            </div>

            {/* Filter: Sort Dir */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thứ tự</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                value={filters.sortDir}
                onChange={(e) => updateFilter("sortDir", e.target.value as TaskFilters["sortDir"])}
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>

          {/* Preset Management inside Collapsible */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bộ lọc lưu trữ</span>
                <select
                  className="h-10 w-48 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-500"
                  value={selectedPreset}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  <option value="">Chọn bộ lọc đã lưu...</option>
                  {presets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={saveCurrentPreset} className="h-10 rounded-xl gap-1">
                <Save className="h-3.5 w-3.5" />
                Lưu preset mới
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={deleteSelectedPreset} 
                disabled={!selectedPreset}
                className="h-10 rounded-xl gap-1 text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa preset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Datatable */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm border-collapse">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-4 w-[35%]">Công việc</th>
                <th className="px-5 py-4 w-[15%]">Người thực hiện</th>
                <th className="px-5 py-4 w-[15%]">Trạng thái</th>
                <th className="px-5 py-4 w-[12%]">Ưu tiên</th>
                <th className="px-5 py-4 w-[13%]">Hạn chót</th>
                <th className="px-5 py-4 w-[15%]">Weight & Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton />
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium">Không tìm thấy công việc nào phù hợp</p>
                      <p className="text-xs text-slate-400">Hãy thử xóa hoặc thay đổi bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const hasOverdue = task.isOverdue === true;
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        "group transition-all duration-150 border-b border-slate-50 hover:bg-slate-50/40",
                        hasOverdue && "bg-red-50/20 border-l-4 border-l-red-500 hover:bg-red-50/30"
                      )}
                    >
                      {/* Column 1: Task Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors hover:underline text-sm md:text-[14px]"
                          >
                            {task.title}
                          </Link>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {task.tags.map((t) => (
                                <span
                                  key={`${task.id}-${t}`}
                                  className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                                >
                                  <Tag className="h-2.5 w-2.5 text-slate-400" />
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Assignees Avatar Group */}
                      <td className="px-5 py-3.5">
                        {task.assignees && task.assignees.length > 0 ? (
                          <div className="flex items-center -space-x-2">
                            {task.assignees.slice(0, 3).map((a) => (
                              <Avatar
                                key={a.id}
                                initials={getInitials(a.name)}
                                size="sm"
                                title={a.name}
                                className="ring-2 ring-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => updateFilter("assigneeId", a.id)}
                              />
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1 text-xs">
                            <User className="h-3.5 w-3.5" /> Chờ phân công
                          </span>
                        )}
                      </td>

                      {/* Column 3: Status Badge */}
                      <td className="px-5 py-3.5">
                        {renderStatusBadge(task.status)}
                      </td>

                      {/* Column 4: Priority Badge */}
                      <td className="px-5 py-3.5">
                        {renderPriorityBadge(task.priority)}
                      </td>

                      {/* Column 5: Smart Deadline Countdown */}
                      <td className="px-5 py-3.5">
                        {renderDeadline(task.deadline, task.isOverdue)}
                      </td>

                      {/* Column 6: Weight & Progress Bar */}
                      <td className="px-5 py-3.5">
                        {renderProgressAndWeight(task.weight, task.progressPercent)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
