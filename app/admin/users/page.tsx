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
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Full Name</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Role</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Department</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{user.email}</td>
              <td className="px-4 py-3 text-sm">{user.fullName}</td>
              <td className="px-4 py-3 text-sm">{user.role}</td>
              <td className="px-4 py-3 text-sm">{user.department?.name || "—"}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-sm">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
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
        <h2 className="text-xl font-bold">Quản lý Người dùng</h2>
        <Link href="/admin/users/new">
          <Button>+ Thêm người dùng</Button>
        </Link>
      </div>

      <Card className="p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <UsersList />
        </Suspense>
      </Card>
    </div>
  );
}
