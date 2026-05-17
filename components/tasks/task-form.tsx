"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { WeightProgressBar } from "@/components/tasks/weight-progress-bar";
import { WeightSelector } from "@/components/tasks/weight-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface AssigneeOption {
  id: string;
  name: string;
}

export interface TaskFormInitial {
  id?: string;
  title?: string;
  description?: string;
  deadline?: string;
  weight?: number;
  priority?: string;
  tags?: string[];
  assigneeIds?: string[];
}

interface TaskFormProps {
  mode: "create" | "edit";
  initial?: TaskFormInitial;
  assignees: AssigneeOption[];
  departmentId?: string;
}

export function TaskForm({ mode, initial, assignees, departmentId }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [deadline, setDeadline] = useState(
    initial?.deadline
      ? new Date(initial.deadline).toISOString().slice(0, 10)
      : ""
  );
  const [weight, setWeight] = useState(initial?.weight ?? 10);
  const [priority, setPriority] = useState(initial?.priority ?? "NORMAL");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    initial?.assigneeIds ?? []
  );
  const [urgentReason, setUrgentReason] = useState("");
  const [weightTotal, setWeightTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeight = useCallback(async (assigneeId: string) => {
    const res = await fetch(`/api/tasks/weight-summary?assigneeId=${assigneeId}`);
    const json = await res.json();
    if (json.success) setWeightTotal(json.data.total);
  }, []);

  useEffect(() => {
    if (selectedAssignees[0]) fetchWeight(selectedAssignees[0]);
  }, [selectedAssignees, fetchWeight]);

  const toggleAssignee = (id: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      title,
      description,
      deadline,
      weight,
      priority,
      tags,
      assigneeIds: selectedAssignees,
      departmentId,
      ...(priority === "URGENT" && urgentReason ? { urgentOverrideReason: urgentReason } : {}),
    };

    const url = mode === "create" ? "/api/tasks" : `/api/tasks/${initial?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Có lỗi xảy ra");
        return;
      }
      router.push(`/dashboard/tasks/${json.data.id}`);
      router.refresh();
    } catch {
      setError("Không thể lưu task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Tiêu đề *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Mô tả</label>
        <textarea
          className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Deadline *</label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
        <Select
          label="Ưu tiên"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={[
            { value: "LOW", label: "Thấp" },
            { value: "NORMAL", label: "Bình thường" },
            { value: "HIGH", label: "Cao" },
            { value: "URGENT", label: "Khẩn cấp" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Trọng số *</label>
        <WeightSelector value={weight} onChange={setWeight} />
        {selectedAssignees[0] && (
          <WeightProgressBar total={weightTotal + weight} className="mt-3" />
        )}
      </div>

      {priority === "URGENT" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Lý do vượt trọng số (nếu cần)
          </label>
          <Input
            value={urgentReason}
            onChange={(e) => setUrgentReason(e.target.value)}
            placeholder="Bắt buộc khi vượt 100% trọng số tháng"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Tag (tối đa 5, phân cách bằng dấu phẩy)</label>
        <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Người thực hiện *</label>
        <div className="flex flex-wrap gap-2">
          {assignees.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleAssignee(a.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedAssignees.includes(a.id)
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || selectedAssignees.length === 0}>
          {loading ? "Đang lưu..." : mode === "create" ? "Tạo task" : "Lưu thay đổi"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/tasks">Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
