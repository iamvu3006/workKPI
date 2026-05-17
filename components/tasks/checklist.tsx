"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface ChecklistItem {
  id: string;
  title: string;
  isDone: boolean;
}

interface ChecklistProps {
  taskId: string;
  readOnly?: boolean;
}

export function Checklist({ taskId, readOnly }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}/checklist`);
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    const json = await res.json();
    if (json.success) {
      setNewTitle("");
      await load();
    }
  };

  const toggle = async (itemId: string, isDone: boolean) => {
    await fetch(`/api/tasks/${taskId}/checklist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    await load();
  };

  const remove = async (itemId: string) => {
    await fetch(`/api/tasks/${taskId}/checklist/${itemId}`, { method: "DELETE" });
    await load();
  };

  const doneCount = items.filter((i) => i.isDone).length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  if (loading) return <p className="text-sm text-slate-500">Đang tải checklist...</p>;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Checklist</h3>
        <span className="text-xs text-slate-500">
          {doneCount}/{items.length} ({percent}%)
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <Checkbox
              checked={item.isDone}
              disabled={readOnly}
              onCheckedChange={(checked) => toggle(item.id, !!checked)}
            />
            <span className={item.isDone ? "text-slate-400 line-through" : "text-slate-800"}>
              {item.title}
            </span>
            {!readOnly && (
              <button
                type="button"
                className="ml-auto text-xs text-red-500"
                onClick={() => remove(item.id)}
              >
                Xóa
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            placeholder="Thêm mục mới..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          />
          <Button type="button" size="sm" onClick={addItem}>
            Thêm
          </Button>
        </div>
      )}
    </div>
  );
}
