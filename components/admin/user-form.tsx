"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface UserFormProps {
  user?: {
    id: string;
    email: string;
    fullName: string;
    departmentId: string | null;
    role: string;
  };
  departments: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function UserForm({ user, departments, onSuccess }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    fullName: user?.fullName || "",
    departmentId: user?.departmentId || "",
    role: user?.role || "EMPLOYEE",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      if (!formData.email || !formData.fullName || !formData.departmentId) {
        setError("Please fill all required fields");
        setLoading(false);
        return;
      }

      const endpoint = isEdit
        ? `/api/admin/users/${user.id}`
        : "/api/admin/users";

      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sendInvite: !isEdit, // Send invite email only on creation
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save user");
      }

      router.push("/admin/users");
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
        {isEdit ? "Edit User" : "Create New User"}
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Email *
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isEdit} // Cannot change email in edit mode
            placeholder="user@example.com"
            className="mt-1"
          />
          {isEdit && (
            <p className="mt-1 text-xs text-slate-500">
              Email cannot be changed
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Full Name *
          </label>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="mt-1"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Department *
          </label>
          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Select a department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Role *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="LEADER">Leader</option>
            <option value="MANAGER">Manager (Trưởng phòng)</option>
            <option value="DIRECTOR">Director</option>
          </select>
        </div>

        {/* Info Message */}
        {!isEdit && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <strong>Note:</strong> A temporary password will be generated and
            sent to the user via email. They must change it on first login.
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading
              ? "Saving..."
              : isEdit
                ? "Update User"
                : "Create User"}
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
