"use client";

import { Input } from "@/components/ui/input";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks/constants";

export type TaskFilterValue = {
  status: string;
  priority: string;
  tag: string;
  from: string;
  to: string;
};

type TaskFilterProps = {
  value: TaskFilterValue;
  onChange: (value: TaskFilterValue) => void;
};

export function TaskFilter({ value, onChange }: TaskFilterProps) {
  function update<K extends keyof TaskFilterValue>(key: K, nextValue: TaskFilterValue[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-5">
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Trạng thái</label>
        <select
          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          value={value.status}
          onChange={(event) => update("status", event.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Ưu tiên</label>
        <select
          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          value={value.priority}
          onChange={(event) => update("priority", event.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
            <option key={priority} value={priority}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Tag"
        value={value.tag}
        onChange={(event) => update("tag", event.target.value)}
        placeholder="Ví dụ: sales"
      />

      <Input
        label="Deadline từ"
        type="date"
        value={value.from}
        onChange={(event) => update("from", event.target.value)}
      />

      <Input
        label="Deadline đến"
        type="date"
        value={value.to}
        onChange={(event) => update("to", event.target.value)}
      />
    </div>
  );
}
