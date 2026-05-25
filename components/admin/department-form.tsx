"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface DepartmentFormProps {
  department?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    managerId: string;
  };
  managers: Array<{ id: string; fullName: string | null; email: string }>;
  onSuccess?: () => void;
}

export function DepartmentForm({
  department,
  managers,
  onSuccess,
}: DepartmentFormProps) {
  const router = useRouter();
  const isEdit = !!department;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: department?.name || "",
    code: department?.code || "",
    description: department?.description || "",
    managerId: department?.managerId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (
        !formData.name ||
        !formData.code ||
        !formData.managerId
      ) {
        setError("Please fill all required fields");
        setLoading(false);
        return;
      }

      const endpoint = isEdit
        ? `/api/admin/departments/${department.id}`
        : "/api/admin/departments";

      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save department");
      }

      router.push("/admin/departments");
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-xl font-bold">
        {isEdit ? "Edit Department" : "Create New Department"}
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Department Name *
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Sales Department"
            className="mt-1"
          />
        </div>

        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Department Code *
          </label>
          <Input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., SALES"
            disabled={isEdit} // Cannot change code in edit mode
            className="mt-1"
          />
          {isEdit && (
            <p className="mt-1 text-xs text-slate-500">
              Department code cannot be changed
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Department description (optional)"
            rows={3}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>

        {/* Manager */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Department Manager (Trưởng phòng) *
          </label>
          <select
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Select a manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.fullName || manager.email}
              </option>
            ))}
          </select>
          {managers.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">
              No users available as managers. Create users first.
            </p>
          )}
        </div>

        {/* Info Message */}
        {!isEdit && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <strong>Note:</strong> The selected user will automatically be
            assigned the Manager role.
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading || managers.length === 0}
            className="flex-1"
          >
            {loading
              ? "Saving..."
              : isEdit
                ? "Update Department"
                : "Create Department"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
