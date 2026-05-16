import { prisma } from "@/lib/db/prisma";
import { DepartmentForm } from "@/components/admin/department-form";

export default async function CreateDepartmentPage() {
  const managers = await prisma.profile.findMany({
    where: {
      role: { in: ["MANAGER", "DIRECTOR"] },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
    orderBy: { fullName: "asc" },
  });

  if (managers.length === 0) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
        <strong>Note:</strong> No managers available. Please create users with
        Manager role first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Department</h1>
        <p className="text-gray-600">
          Add a new department to organize your team structure.
        </p>
      </div>

      <DepartmentForm managers={managers} />
    </div>
  );
}
