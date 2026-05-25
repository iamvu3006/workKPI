import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

async function UsersList() {
  const users = await prisma.profile.findMany({
    take: 50,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      departmentId: true,
      department: {
        select: { name: true },
      },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Full Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Role</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Department</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
              <td className="px-4 py-3 text-sm text-slate-700">{user.email}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{user.fullName}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{user.role}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{user.department?.name || "—"}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-sm">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  Chỉnh sửa
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quản trị</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Người dùng</h1>
        </div>
        <Link href="/admin/users/new">
          <Button className="gap-2">+ Thêm người dùng</Button>
        </Link>
      </div>

      <Card className="p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-slate-500">Đang tải...</div>
            </div>
          }
        >
          <UsersList />
        </Suspense>
      </Card>
    </div>
  );
}
