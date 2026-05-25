import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen">
      {/* Admin Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">A</div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Admin — WorkKPI</h1>
            <p className="text-xs text-slate-500">{profile?.email}</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
          <nav className="space-y-1 p-3">
            {[
              { href: "/admin/users", label: "Người dùng", icon: "👥" },
              { href: "/admin/departments", label: "Phòng ban", icon: "🏢" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}

