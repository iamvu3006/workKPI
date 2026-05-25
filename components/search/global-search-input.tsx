"use client";

import React, { useEffect, useRef, useState } from "react";

type TaskResult = { id: string; title: string; status: string; priority: string; deadline: string };
type UserResult = { id: string; fullName?: string; displayName?: string; email?: string };
type DeptResult = { id: string; name: string; code: string };

export default function GlobalSearchInput() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [departments, setDepartments] = useState<DeptResult[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!query || query.length < 3) {
      return;
    }

    // debounce 300ms
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}&limit=5`);
        const json = await res.json();
        if (json?.success) {
          setTasks(json.data.tasks || []);
          setUsers(json.data.users || []);
          setDepartments(json.data.departments || []);
        }
      } catch {
        // ignore network errors silently
      } finally {
        setLoading(false);
        setOpen(true);
      }
    }, 300) as unknown as number;

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query]);

  function navigateTo(url: string) {
    window.location.href = url;
  }

  return (
    <div className="relative w-full max-w-md">
      <svg className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (next.trim().length < 3) {
            setTasks([]);
            setUsers([]);
            setDepartments([]);
            setLoading(false);
          } else {
            setLoading(true);
          }
        }}
        onFocus={() => setOpen(true)}
        placeholder="Tìm task, người, phòng... (≥3 ký tự)"
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-400">Ctrl K</kbd>
      {open && (query.length >= 3 || loading) && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="p-2">
            {loading && <div className="p-2 text-xs text-slate-500">Đang tìm kiếm...</div>}

            {tasks.length > 0 && (
              <div>
                <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Tasks</span>
                </div>
                <ul>
                  {tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
                      onClick={() => navigateTo(`/dashboard/tasks/${t.id}`)}
                    >
                      <div className="mt-0.5 size-5 shrink-0 rounded-md bg-teal-100 flex items-center justify-center">
                        <svg className="size-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-400">{t.status} · {t.deadline?.split("T")[0]}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {users.length > 0 && (
              <div className="mt-2">
                <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">People</span>
                </div>
                <ul>
                  {users.map((u) => (
                    <li
                      key={u.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
                      onClick={() => navigateTo(`/admin/users/${u.id}`)}
                    >
                      <div className="mt-0.5 size-5 shrink-0 rounded-md bg-teal-100 flex items-center justify-center">
                        <svg className="size-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.629 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.fullName || u.displayName || u.email}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {departments.length > 0 && (
              <div className="mt-2">
                <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Departments</span>
                </div>
                <ul>
                  {departments.map((d) => (
                    <li
                      key={d.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
                      onClick={() => navigateTo(`/admin/departments/${d.id}`)}
                    >
                      <div className="mt-0.5 size-5 shrink-0 rounded-md bg-teal-100 flex items-center justify-center">
                        <svg className="size-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.code}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && tasks.length === 0 && users.length === 0 && departments.length === 0 && (
              <div className="p-2 text-xs text-slate-500">Không tìm thấy kết quả.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
