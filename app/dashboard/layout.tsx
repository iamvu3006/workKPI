import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav, type DashboardRole } from "@/components/layout/sidebar-nav";
import { prisma } from "@/lib/db/prisma";
import { buildTaskListWhere } from "@/lib/tasks/query-scope";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<DashboardRole, string> = {
  EMPLOYEE: "Nhân viên",
  LEADER: "Trưởng nhóm",
  MANAGER: "Trưởng phòng",
  DIRECTOR: "Ban giám đốc",
  ADMIN: "Quản trị viên",
};

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatRelativeDeadline(deadline: Date) {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const target = new Date(deadline);
  target.setHours(23, 59, 59, 999);

  const dayDiff = Math.ceil((target.getTime() - endOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) return `Trễ ${Math.abs(dayDiff)} ngày`;
  if (dayDiff === 0) return "Hôm nay";
  if (dayDiff === 1) return "Còn 1 ngày";
  return `Còn ${dayDiff} ngày`;
}

function normalizeName(
  item: { displayName: string | null; fullName: string | null; email: string },
  fallback = "Người dùng"
) {
  return item.displayName || item.fullName || item.email || fallback;
}

function WorkspaceStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

function ActionLink({
  href,
  label,
  variant = "default",
}: {
  href: string;
  label: string;
  variant?: "default" | "outline" | "ghost";
}) {
  return (
    <Button asChild variant={variant} size="sm" className="rounded-xl px-4 font-semibold text-xs h-9 cursor-pointer w-full">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

function getActionItems(role: DashboardRole) {
  const actions: { href: string; label: string; variant?: "default" | "outline" | "ghost" }[] = [
    { href: "/dashboard/notifications", label: "Mở hộp thư", variant: "outline" },
  ];

  if (role === "EMPLOYEE") {
    actions.push({ href: "/dashboard/profile", label: "Cá nhân", variant: "ghost" });
  } else if (role === "LEADER") {
    actions.push({ href: "/dashboard/tasks", label: "Duyệt task nhóm", variant: "ghost" });
  } else if (role === "MANAGER") {
    actions.push({ href: "/dashboard/reports/company", label: "Xem báo cáo phòng", variant: "ghost" });
  } else if (role === "DIRECTOR") {
    actions.push({ href: "/dashboard/kpi", label: "Kiểm tra KPI", variant: "ghost" });
  } else {
    actions.push({ href: "/admin/users", label: "Quản trị tài khoản", variant: "ghost" });
  }

  return actions;
}

async function loadDashboardLayoutData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      displayName: true,
      role: true,
      departmentId: true,
      teamId: true,
      department: { select: { id: true, name: true, code: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!profile) {
    redirect("/auth/login");
  }

  const now = new Date();

  // Common notification retrieval
  const notificationsPromise = prisma.notification.findMany({
    where: {
      userId: profile.id,
      createdAt: { gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90) },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      payload: true,
      readAt: true,
      createdAt: true,
    },
  });

  const unreadCountPromise = prisma.notification.count({
    where: { userId: profile.id, readAt: null },
  });

  // Calculate task statistics for sidebar widgets
  const leaderMemberIds =
    profile.role === "LEADER" && profile.teamId
      ? (
          await prisma.profile.findMany({
            where: { teamId: profile.teamId, status: "ACTIVE" },
            select: { id: true },
          })
        ).map((member) => member.id)
      : [];

  const taskScope =
    profile.role === "LEADER" && profile.teamId
      ? {
          deletedAt: null,
          parentTaskId: null,
          departmentId: profile.departmentId ?? undefined,
          assignees: {
            some: {
              assigneeId: {
                in: leaderMemberIds,
              },
            },
          },
        }
      : buildTaskListWhere(
          {
            id: profile.id,
            role: profile.role,
            departmentId: profile.departmentId,
            teamId: profile.teamId,
          },
          {}
        );

  const [notifications, unreadCount, scopedTasks] = await Promise.all([
    notificationsPromise,
    unreadCountPromise,
    prisma.task.findMany({
      where: taskScope,
      select: {
        id: true,
        status: true,
        deadline: true,
      },
    }),
  ]);

  // Sidebar task counts
  const activeTasks = scopedTasks.filter(
    (task) => task.status !== "DONE" && task.status !== "CANCELLED"
  );
  const dueToday = activeTasks.filter((task) => formatRelativeDeadline(task.deadline) === "Hôm nay");

  return {
    profile,
    now,
    unreadCount,
    notifications,
    activeTasksCount: activeTasks.length,
    dueTodayCount: dueToday.length,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await loadDashboardLayoutData();
  const actionItems = getActionItems(data.profile.role as DashboardRole);

  return (
    <main className="min-h-screen w-full bg-slate-50/50 px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">
        <NotificationToast />

        {/* Sidebar Navigation */}
        <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            
            {/* Minimalist User Info */}
            <div className="border-b border-slate-100 bg-slate-50/50 p-4.5">
              <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">WorkKPI</p>
                  <h1 className="mt-1.5 text-base font-extrabold tracking-tight text-slate-950 truncate">
                    {normalizeName(data.profile)}
                  </h1>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-700 uppercase shrink-0 border border-slate-200/30">
                  {ROLE_LABELS[data.profile.role as DashboardRole]}
                </span>
              </div>
              <p className="mt-2.5 text-xs text-slate-500 font-medium truncate">
                {data.profile.department?.name ?? "Chưa gán phòng"}
                {data.profile.team?.name ? ` · ${data.profile.team.name}` : ""}
              </p>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <SidebarNav role={data.profile.role as DashboardRole} />

              {/* Minimal Today Widgets */}
              <div className="grid gap-1.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1">Hôm nay</p>
                <WorkspaceStat label="Chưa đọc" value={`${data.unreadCount > 99 ? "99+" : data.unreadCount}`} />
                <WorkspaceStat label="Đang chạy" value={String(data.activeTasksCount)} />
                <WorkspaceStat label="Đến hạn" value={String(data.dueTodayCount)} />
              </div>

              {/* Minimalist Action Center */}
              <div className="rounded-xl border border-slate-100 p-3 bg-white">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-2">Thao tác nhanh</p>
                <div className="grid gap-1.5">
                  {actionItems.map((action) => (
                    <ActionLink key={action.href} href={action.href} label={action.label} variant={action.variant} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <section className="flex min-w-0 flex-col gap-4 lg:gap-5">
          {/* Top Horizontal Navigation Bar */}
          <header className="flex h-14 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-4.5 shadow-sm backdrop-blur-sm shrink-0">
            {/* Left side empty placeholder to maintain justify-between alignment */}
            <div />

            {/* Quick Actions & Profiles */}
            <div className="flex items-center gap-3">
              {/* Notifications bell */}
              <NotificationBell initialUnreadCount={data.unreadCount} initialNotifications={data.notifications} />
              
              <div className="h-5 w-[1px] bg-slate-200" />
              
              {/* Active Month indicator */}
              <div className="hidden sm:block rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-right shrink-0">
                <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Tháng hiện tại</div>
                <div className="text-[11px] font-bold text-slate-800 leading-tight">{formatMonthLabel(data.now)}</div>
              </div>

              <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

              {/* Sign-out button */}
              <SignOutButton />
            </div>
          </header>

          {/* This is the wrapped child sub-page content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
