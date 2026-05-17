"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS } from "@/lib/tasks/constants";

import type { TaskCardData } from "./task-card";

interface SubtaskListProps {
  parentTaskId: string;
}

export function SubtaskList({ parentTaskId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<TaskCardData[]>([]);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${parentTaskId}/subtasks`);
    const json = await res.json();
    if (json.success) setSubtasks(json.data);
  }, [parentTaskId]);

  useEffect(() => {
    load();
    fetch(`/api/tasks/${parentTaskId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data.assignees) {
          setAssignees(j.data.assignees);
          if (j.data.assignees[0]) setAssigneeId(j.data.assignees[0].id);
        }
      });
  }, [parentTaskId, load]);

  const create = async () => {
    if (!title.trim() || !assigneeId) return;
    const res = await fetch(`/api/tasks/${parentTaskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, assigneeId, deadline: deadline || undefined }),
    });
    const json = await res.json();
    if (json.success) {
      setTitle("");
      setDeadline("");
      load();
    } else {
      alert(json.error);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">Sub-task</h3>
      <ul className="space-y-2 border-l-2 border-teal-200 pl-4">
        {subtasks.map((st) => (
          <li key={st.id} className="text-sm">
            <Link href={`/dashboard/tasks/${st.id}`} className="font-medium text-teal-700 hover:underline">
              {st.title}
            </Link>
            <span className="ml-2 text-slate-500">
              {STATUS_LABELS[st.status as keyof typeof STATUS_LABELS]} · {st.progressPercent}%
            </span>
          </li>
        ))}
        {subtasks.length === 0 && (
          <li className="text-sm text-slate-500">Chưa có sub-task</li>
        )}
      </ul>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="Tiêu đề sub-task" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <Button type="button" size="sm" onClick={create}>
        Thêm sub-task
      </Button>
    </div>
  );
}
