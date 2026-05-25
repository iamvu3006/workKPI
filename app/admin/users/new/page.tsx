import { prisma } from "@/lib/db/prisma";
import { UserForm } from "@/components/admin/user-form";

export default async function CreateUserPage() {
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (departments.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
        <strong>Note:</strong> No departments exist. Please create a department
        first before adding users.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-slate-600">
          Add a new user to the system. A temporary password will be sent via
          email.
        </p>
      </div>

      <UserForm departments={departments} />
    </div>
  );
}
