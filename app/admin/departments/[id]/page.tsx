import { prisma } from "@/lib/db/prisma";
import { DepartmentForm } from "@/components/admin/department-form";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function DepartmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [department, managers] = await Promise.all([
    prisma.department.findUnique({
      where: { id: params.id },
      include: {
        manager: true,
        teams: {
          include: {
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
        <h1 className="text-3xl font-bold">{department.name}</h1>
        <p className="text-gray-600">{department.code}</p>
        {department.description && (
          <p className="mt-1 text-sm text-gray-600">{department.description}</p>
        )}
      </div>

      {/* Department Info Summary */}
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-white p-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-gray-600">Manager</p>
          <p className="font-semibold">
            {department.manager?.fullName || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Members</p>
          <p className="font-semibold">{department._count.members}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Teams</p>
          <p className="font-semibold">{department._count.teams}</p>
        </div>
      </div>

      {/* Edit Form */}
      <DepartmentForm department={department} managers={managers} />

      {/* Teams Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Teams in this Department</h3>

        {department.teams.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-600">
            No teams yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Leader</th>
                  <th className="px-4 py-2 text-center">Members</th>
                </tr>
              </thead>
              <tbody>
                {department.teams.map((team) => (
                  <tr key={team.id} className="border-b">
                    <td className="px-4 py-3">{team.name}</td>
                    <td className="px-4 py-3">
                      {team.leader?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {team._count.members}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
