import { prisma } from "@/lib/db/prisma";
import { UserForm } from "@/components/admin/user-form";
import { notFound } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, departments] = await Promise.all([
    prisma.profile.findUnique({
      where: { id },
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

  const sanitizedUser = {
    ...user,
    fullName: user.fullName || "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{sanitizedUser.fullName || sanitizedUser.email}</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>

      {/* User Info Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                user.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {user.status}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user.role}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Login</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</p>
        </div>
      </div>

      {/* Edit Form */}
      <UserForm user={sanitizedUser} departments={departments} />
    </div>
  );
}
