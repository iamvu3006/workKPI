"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { TaskFilter } from "@/components/tasks/task-filter";

import type { TaskFilterValue } from "@/components/tasks/task-filter";

type TaskSearchItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string;
};

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const normalized = query.trim();
  const parts = useMemo(() => {
    if (!normalized) return [text];
    const regex = new RegExp(`(${escapeRegExp(normalized)})`, "ig");
    return text.split(regex);
  }, [text, normalized]);

  return (
    <>
      {parts.map((part, index) => {
        const active = part.toLowerCase() === normalized.toLowerCase();
        return active ? (
          <mark key={`${part}-${index}`} className="rounded bg-amber-200/70 px-0.5 text-slate-900">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

export function TaskSearch() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<TaskFilterValue>({
    status: "",
    priority: "",
    tag: "",
    from: "",
    to: "",
  });
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskSearchItem[]>([]);
  const [total, setTotal] = useState(0);

  function handleFilterChange(next: TaskFilterValue) {
    setFilters(next);
    if (q.trim().length >= 3) {
      setLoading(true);
    }
  }

  useEffect(() => {
    const normalized = q.trim();
    if (normalized.length < 3) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: normalized, limit: "10" });
        if (filters.status) params.set("status", filters.status);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.tag) params.set("tag", filters.tag);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);

        const response = await fetch(`/api/tasks/search?${params.toString()}`);
        const json = await response.json();

        if (json?.success) {
          setTasks((json.data?.data ?? []) as TaskSearchItem[]);
          setTotal(Number(json.data?.total ?? 0));
        } else {
          setTasks([]);
          setTotal(0);
        }
      } catch {
        setTasks([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [q, filters]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">Tìm kiếm task</h2>
        <p className="text-sm text-slate-600">Nhập tối thiểu 3 ký tự để tìm trong tiêu đề và mô tả.</p>
      </div>

      <div className="mt-3">
        <Input
          value={q}
          onChange={(event) => {
            const next = event.target.value;
            setQ(next);

            if (next.trim().length < 3) {
              setTasks([]);
              setTotal(0);
              setLoading(false);
            } else {
              setLoading(true);
            }
          }}
          placeholder="Ví dụ: báo cáo tháng"
          aria-label="Tìm kiếm task"
        />
      </div>

      <TaskFilter value={filters} onChange={handleFilterChange} />

      {q.trim().length > 0 && q.trim().length < 3 && (
        <p className="mt-3 text-sm text-slate-500">Cần ít nhất 3 ký tự để bắt đầu tìm kiếm.</p>
      )}

      {loading && <p className="mt-3 text-sm text-slate-500">Đang tìm kiếm...</p>}

      {!loading && q.trim().length >= 3 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">Tìm thấy {total} task phù hợp</p>

          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
              Không tìm thấy kết quả cho &quot;{q.trim()}&quot;.
            </p>
          ) : (
            tasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="block rounded-xl border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/30"
              >
                <h3 className="font-medium text-slate-900">
                  <HighlightText text={task.title} query={q.trim()} />
                </h3>
                {task.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    <HighlightText text={task.description} query={q.trim()} />
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {task.status} · {task.priority} · hạn {new Date(task.deadline).toLocaleDateString("vi-VN")}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </section>
  );
}
