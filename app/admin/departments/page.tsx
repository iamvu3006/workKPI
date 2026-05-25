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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Manager</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Members</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Teams</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {departments.map((dept) => (
            <tr key={dept.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{dept.name}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{dept.code}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{dept.manager?.fullName || "—"}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{dept._count.members}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{dept._count.teams}</td>
              <td className="px-4 py-3 text-right text-sm">
                <Link
                  href={`/admin/departments/${dept.id}`}
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

export default function AdminDepartmentsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quản trị</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Phòng ban</h1>
        </div>
        <Link href="/admin/departments/new">
          <Button className="gap-2"> 
            <span>+</span> Thêm phòng ban
          </Button>
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
          <DepartmentsList />
        </Suspense>
      </Card>
    </div>
  );
}
