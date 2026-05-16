import { prisma } from "@/lib/db/prisma";
import { UserForm } from "@/components/admin/user-form";
import { notFound } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [user, departments] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{user.fullName}</h1>
        <p className="text-gray-600">{user.email}</p>
      </div>

      {/* User Info Summary */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-white p-4 md:grid-cols-4">
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <p className="font-semibold">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                user.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {user.status}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Role</p>
          <p className="font-semibold">{user.role}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Created</p>
          <p className="font-semibold">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Last Login</p>
          <p className="font-semibold">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <UserForm user={user} departments={departments} />
    </div>
  );
}
