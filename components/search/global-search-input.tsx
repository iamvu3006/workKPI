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
        placeholder="Tìm kiếm (Ctrl+K) — task, người, phòng... (>= 3 ký tự)"
        className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
      />

      {open && (query.length >= 3 || loading) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg text-sm">
          <div className="p-2">
            {loading && <div className="p-2 text-xs text-gray-500">Đang tìm kiếm...</div>}

            {tasks.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500">Tasks</div>
                <ul>
                  {tasks.map((t) => (
                    <li
                      key={t.id}
                      className="cursor-pointer p-2 hover:bg-gray-50"
                      onClick={() => navigateTo(`/dashboard/tasks/${t.id}`)}
                    >
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-gray-500">{t.status} • due {t.deadline?.split("T")[0]}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {users.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-500">People</div>
                <ul>
                  {users.map((u) => (
                    <li
                      key={u.id}
                      className="cursor-pointer p-2 hover:bg-gray-50"
                      onClick={() => navigateTo(`/admin/users/${u.id}`)}
                    >
                      <div className="font-medium">{u.fullName || u.displayName || u.email}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {departments.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-500">Departments</div>
                <ul>
                  {departments.map((d) => (
                    <li
                      key={d.id}
                      className="cursor-pointer p-2 hover:bg-gray-50"
                      onClick={() => navigateTo(`/admin/departments/${d.id}`)}
                    >
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.code}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && tasks.length === 0 && users.length === 0 && departments.length === 0 && (
              <div className="p-2 text-xs text-gray-500">Không tìm thấy kết quả.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
