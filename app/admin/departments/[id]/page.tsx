import { prisma } from "@/lib/db/prisma";
import { DepartmentForm } from "@/components/admin/department-form";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [department, managers] = await Promise.all([
    prisma.department.findUnique({
      where: { id },
      include: {
        manager: true,
        _count: {
          select: {
            members: true,
            teams: true,
          },
        },
        teams: {
          include: {
            leader: {
              select: { id: true, fullName: true },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
    }),
    prisma.profile.findMany({
      where: {
        role: { in: ["MANAGER", "DIRECTOR"] },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{department.name}</h1>
        <p className="text-sm text-slate-500">{department.code}</p>
        {department.description && (
          <p className="mt-1 text-sm text-slate-600">{department.description}</p>
        )}
      </div>

      {/* Department Info Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[
          { label: "Manager", value: department.manager?.fullName || "—" },
          { label: "Members", value: String(department._count.members) },
          { label: "Teams", value: String(department._count.teams) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      <DepartmentForm department={department} managers={managers} />

      {/* Teams Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Teams in this Department</h3>

        {department.teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">Chưa có đội nhóm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Leader</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {department.teams.map((team) => (
                    <tr key={team.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-700">{team.name}</td>
                      <td className="px-4 py-3 text-slate-700">{team.leader?.fullName || "—"}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{team._count.members}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
