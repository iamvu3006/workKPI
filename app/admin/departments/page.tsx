import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

async function DepartmentsList() {
  const departments = await prisma.department.findMany({
    take: 50,
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      managerId: true,
      manager: {
        select: { fullName: true },
      },
      _count: {
        select: {
          members: true,
          teams: true,
        },
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
            <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Code</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Manager</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Members</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Teams</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium">{dept.name}</td>
              <td className="px-4 py-3 text-sm">{dept.code}</td>
              <td className="px-4 py-3 text-sm">{dept.manager?.fullName || "—"}</td>
              <td className="px-4 py-3 text-sm">{dept._count.members}</td>
              <td className="px-4 py-3 text-sm">{dept._count.teams}</td>
              <td className="px-4 py-3 text-right text-sm">
                <Link
                  href={`/admin/departments/${dept.id}`}
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

export default function AdminDepartmentsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý Phòng ban</h2>
        <Link href="/admin/departments/new">
          <Button>+ Thêm phòng ban</Button>
        </Link>
      </div>

      <Card className="p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <DepartmentsList />
        </Suspense>
      </Card>
    </div>
  );
}
