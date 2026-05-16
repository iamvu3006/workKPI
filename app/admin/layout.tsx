import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Admin Dashboard | WorkKPI",
  description: "Administrator control panel",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get user profile with role
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true, fullName: true },
  });

  // Check if user is admin
  if (profile?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 border-r bg-white">
          <nav className="space-y-1 p-4">
            <a
              href="/admin/users"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Quản lý Người dùng
            </a>
            <a
              href="/admin/departments"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Quản lý Phòng ban
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

