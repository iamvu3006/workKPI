import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "../notifications/notification-bell";
import { NotificationToast } from "../notifications/notification-toast";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { prisma } from "@/lib/db/prisma";
import { calculateKpiEstimate } from "@/lib/kpi/calculator";
import { monthBounds } from "@/lib/kpi/month-range";
import { buildTaskListWhere } from "@/lib/tasks/query-scope";
import { createClient } from "@/utils/supabase/server";

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

const ROLE_META = {
  EMPLOYEE: {
    caption: "My workbench",
    title: "Tập trung vào việc cần làm ngay",
    description: "Theo dõi task cá nhân, thông báo, KPI ước tính và các mốc sắp đến trong một màn hình.",
    accent: "from-teal-600 via-cyan-500 to-sky-500",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
  },
  LEADER: {
    caption: "Team command",
    title: "Điều phối team theo nhịp làm việc rõ ràng",
    description: "Xem task của team, trạng thái thành viên, và các tín hiệu cần xử lý trước khi chúng thành rủi ro.",
    accent: "from-blue-600 via-sky-500 to-cyan-500",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
  },
  MANAGER: {
    caption: "Department control",
    title: "Quản lý phòng ban với độ phủ dữ liệu rõ ràng",
    description: "Tập trung vào KPI phòng, luồng task, và tình hình vận hành trong phạm vi phụ trách.",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  DIRECTOR: {
    caption: "Company pulse",
    title: "Nhìn toàn công ty trong một nhịp điều hành",
    description: "Theo dõi KPI, thứ tự ưu tiên và chất lượng thực thi trên toàn tổ chức.",
    accent: "from-slate-950 via-slate-800 to-teal-900",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
  },
  ADMIN: {
    caption: "Governance hub",
    title: "Bảng điều khiển dành cho vận hành và quản trị",
    description: "Điều phối user, phòng ban, session, và các tín hiệu bảo mật trên một workspace gọn mà mạnh.",
    accent: "from-violet-700 via-slate-900 to-cyan-900",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
  },
} satisfies Record<DashboardRole, { caption: string; title: string; description: string; accent: string; badge: string }>;

function getNavItems(role: DashboardRole) {
  const base = [
    { href: "/dashboard", label: "Home", description: "Tổng quan hoạt động" },
    { href: "/dashboard/tasks", label: "Tasks", description: "Danh sách và workflow" },
    { href: "/dashboard/notifications", label: "Notifications", description: "Tín hiệu mới nhất" },
    { href: "/dashboard/profile", label: "Profile", description: "Thông tin cá nhân" },
  ];

  if (role === "EMPLOYEE") {
    return [
      ...base,
      { href: "/dashboard/kpi", label: "KPI", description: "Điểm cá nhân" },
      { href: "/dashboard/reports/monthly", label: "Reports", description: "Báo cáo tháng" },
    ];
  }

  if (role === "LEADER") {
    return [
      ...base,
      { href: "/dashboard/kpi/department", label: "KPI team", description: "Hiệu suất team" },
      { href: "/dashboard/reports/weekly", label: "Weekly report", description: "Nhịp theo tuần" },
      { href: "/dashboard/reports/monthly", label: "Reports", description: "Báo cáo tổng hợp" },
    ];
  }

  if (role === "MANAGER") {
    return [
      ...base,
      { href: "/dashboard/kpi/department", label: "Department KPI", description: "KPI phòng ban" },
      { href: "/dashboard/reports/company", label: "Company report", description: "Góc nhìn phòng" },
      { href: "/admin/departments", label: "Departments", description: "Tổ chức & sơ đồ" },
    ];
  }

  if (role === "DIRECTOR") {
    return [
      ...base,
      { href: "/dashboard/kpi", label: "Company KPI", description: "Chỉ số toàn công ty" },
      { href: "/dashboard/reports/company", label: "Company report", description: "Bức tranh tổng thể" },
      { href: "/admin/users", label: "Users", description: "Quan sát tài khoản" },
    ];
  }

  return [
    ...base,
    { href: "/admin/users", label: "Users", description: "Quản trị tài khoản" },
    { href: "/admin/departments", label: "Departments", description: "Phòng ban và team" },
    { href: "/dashboard/reports/company", label: "Reports", description: "Báo cáo hệ thống" },
  ];
}

function getActionItems(role: DashboardRole) {
  const actions: { href: string; label: string; variant?: "default" | "outline" | "ghost" }[] = [
    { href: "/dashboard/tasks/new", label: "New work item" },
    { href: "/dashboard/notifications", label: "Open inbox", variant: "outline" },
  ];

  if (role === "EMPLOYEE") {
    actions.push({ href: "/dashboard/profile/settings", label: "Update settings", variant: "ghost" });
  } else if (role === "LEADER") {
    actions.push({ href: "/dashboard/tasks", label: "Review team tasks", variant: "ghost" });
  } else if (role === "MANAGER") {
    actions.push({ href: "/dashboard/reports/company", label: "Open reports", variant: "ghost" });
  } else if (role === "DIRECTOR") {
    actions.push({ href: "/dashboard/kpi", label: "Check KPI", variant: "ghost" });
  } else {
    actions.push({ href: "/admin/users", label: "Manage users", variant: "ghost" });
  }

  return actions;
}

function SidebarLink({
  href,
  label,
  description,
  active,
}: {
  href: string;
  label: string;
  description: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition-all ${
        active
          ? "border-slate-300 bg-slate-950 text-white shadow-lg shadow-slate-950/10"
          : "border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
      }`}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className={`mt-1 block text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
          {description}
        </span>
      </span>
      <span className={`mt-1 text-xs uppercase tracking-[0.18em] ${active ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"}`}>
        Open
      </span>
    </Link>
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
    <Button asChild variant={variant} size="lg" className="rounded-full px-5 shadow-sm">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

function WorkspaceStat({
  label,
  value,
  inverted = false,
}: {
  label: string;
  value: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        inverted ? "border-white/15 bg-white/10 text-white backdrop-blur-sm" : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <div className={`text-[11px] uppercase tracking-[0.22em] ${inverted ? "text-white/60" : "text-slate-500"}`}>
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

async function loadDashboardHomeData() {
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
  const { start, end } = monthBounds(now.getMonth() + 1, now.getFullYear());

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

  const [notifications, unreadCount] = await Promise.all([notificationsPromise, unreadCountPromise]);

  const scopedTasks =
    profile.role === "DIRECTOR" || profile.role === "ADMIN"
      ? await prisma.task.findMany({
          where: { deletedAt: null, parentTaskId: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true,
            progressPercent: true,
            assignees: {
              select: {
                assignee: { select: { id: true, displayName: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
          take: 80,
        })
      : await prisma.task.findMany({
          where: taskScope,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true,
            progressPercent: true,
            assignees: {
              select: {
                assignee: { select: { id: true, displayName: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
          take: 80,
        });

  const departmentMembers =
    profile.role === "LEADER" && profile.teamId
      ? await prisma.profile.findMany({
          where: { teamId: profile.teamId, status: "ACTIVE" },
          select: {
            id: true,
            displayName: true,
            fullName: true,
            email: true,
            role: true,
            department: { select: { name: true } },
          },
          orderBy: [{ role: "asc" }, { displayName: "asc" }],
        })
      : profile.role === "MANAGER" && profile.departmentId
        ? await prisma.profile.findMany({
            where: { departmentId: profile.departmentId, status: "ACTIVE" },
            select: {
              id: true,
              displayName: true,
              fullName: true,
              email: true,
              role: true,
              department: { select: { name: true } },
            },
            orderBy: [{ role: "asc" }, { displayName: "asc" }],
          })
        : await prisma.profile.findMany({
            where: { status: "ACTIVE", role: { in: ["EMPLOYEE", "LEADER", "MANAGER"] } },
            select: {
              id: true,
              displayName: true,
              fullName: true,
              email: true,
              role: true,
              department: { select: { name: true } },
            },
            orderBy: [{ role: "asc" }, { displayName: "asc" }],
          });

  const monthlyKpis = await prisma.kpiRecord.findMany({
    where:
      profile.role === "DIRECTOR" || profile.role === "ADMIN"
        ? { month: now.getMonth() + 1, year: now.getFullYear() }
        : profile.role === "MANAGER" && profile.departmentId
          ? {
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              user: { departmentId: profile.departmentId },
            }
          : profile.role === "LEADER" && profile.teamId
            ? {
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                user: { teamId: profile.teamId },
              }
            : { userId: profile.id, month: now.getMonth() + 1, year: now.getFullYear() },
    select: {
      userId: true,
      totalScore: true,
      grade: true,
      onTimeRate: true,
      user: {
        select: {
          id: true,
          displayName: true,
          fullName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  const currentMonthTasks = scopedTasks.filter((task) => {
    const deadline = new Date(task.deadline);
    return deadline >= start && deadline <= end;
  });

  const countByStatus = currentMonthTasks.reduce<Record<string, number>>(
    (acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    },
    { TO_DO: 0, IN_PROGRESS: 0, PENDING: 0, REVIEW: 0, DONE: 0, CANCELLED: 0 }
  );

  const activeTasks = currentMonthTasks.filter(
    (task) => task.status !== "DONE" && task.status !== "CANCELLED"
  );
  const dueToday = activeTasks.filter((task) => formatRelativeDeadline(task.deadline) === "Hôm nay");
  const overdue = activeTasks.filter((task) => formatRelativeDeadline(task.deadline).startsWith("Trễ"));
  const topUrgentTasks = activeTasks.slice(0, 5);
  const nearestDeadline = activeTasks[0] ?? null;

  const employeeTasks = scopedTasks.filter((task) =>
    task.assignees.some((assignment) => assignment.assignee.id === profile.id)
  );

  const employeeMonthTasks = employeeTasks.filter((task) => {
    const deadline = new Date(task.deadline);
    return deadline >= start && deadline <= end;
  });

  const employeeEstimate = calculateKpiEstimate(
    employeeMonthTasks
      .filter((task) => task.status === "DONE")
      .map((task) => ({
        id: task.id,
        title: task.title,
        weight: 100,
        progressPercent: task.progressPercent,
        qualityScore: 100,
        penaltyDays: 0,
        deadline: task.deadline,
        completedAt: new Date(task.deadline),
        submittedAt: null,
      })),
    employeeMonthTasks
      .filter(
        (task) => task.status === "IN_PROGRESS" || task.status === "PENDING" || task.status === "REVIEW"
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        weight: 100,
        progressPercent: task.progressPercent,
      }))
  );

  const kpiByUser = new Map(
    monthlyKpis.map((record) => [
      record.userId,
      {
        totalScore: record.totalScore,
        grade: record.grade,
        onTimeRate: record.onTimeRate,
        name: normalizeName(record.user),
        departmentName: record.user.department?.name ?? null,
      },
    ])
  );

  const departmentRows =
    profile.role === "DIRECTOR" || profile.role === "ADMIN"
      ? Array.from(
          monthlyKpis
            .reduce<Map<string, { total: number; count: number }>>((acc, record) => {
              const departmentName = record.user.department?.name ?? "Chưa phân phòng";
              const current = acc.get(departmentName) ?? { total: 0, count: 0 };
              acc.set(departmentName, {
                total: current.total + record.totalScore,
                count: current.count + 1,
              });
              return acc;
            }, new Map())
            .entries()
        ).map(([name, value]) => ({
          name,
          avgKpi: value.count > 0 ? Math.round((value.total / value.count) * 10) / 10 : null,
          members: value.count,
        }))
      : [];

  const companyAvg =
    monthlyKpis.length > 0
      ? Math.round(
          (monthlyKpis.reduce((sum, record) => sum + record.totalScore, 0) / monthlyKpis.length) * 10
        ) / 10
      : null;

  const forecastBase =
    profile.role === "EMPLOYEE"
      ? employeeEstimate.totalScore
      : companyAvg ?? employeeEstimate.totalScore;

  const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10));

  const forecastSuggestions = [
    ...(overdue.length > 0 ? [`Xử lý ngay ${overdue[0].title} vì đang quá hạn`] : []),
    ...(dueToday.length > 0 ? [`Ưu tiên ${dueToday[0].title} trong hôm nay`] : []),
    ...(topUrgentTasks.length > 1 ? [`Đẩy tiến độ ${topUrgentTasks[1].title} sang trạng thái hoàn tất`] : []),
  ].slice(0, 3);

  const forecast = {
    title: "Dự báo KPI cuối tháng",
    description: "Ba kịch bản dự phóng dựa trên KPI ước tính và các task đang có ảnh hưởng lớn nhất.",
    scenarios: [
      {
        label: "Bi quan",
        score: clampScore(forecastBase * 0.88 - overdue.length * 1.2),
        detail: "Nếu các task quá hạn tiếp tục chậm hoặc bị kéo dài thêm một nhịp.",
      },
      {
        label: "Bình thường",
        score: clampScore(forecastBase),
        detail: "Giữ nhịp hoàn thành hiện tại và các task đang làm như kế hoạch.",
      },
      {
        label: "Lạc quan",
        score: clampScore(forecastBase * 1.08 + Math.min(5, dueToday.length + activeTasks.length) * 0.4),
        detail: "Ưu tiên task gần deadline và đẩy nhanh task đang ở giai đoạn cuối.",
      },
    ],
    suggestions: forecastSuggestions.length > 0 ? forecastSuggestions : ["Không có task nổi bật để ưu tiên ngay lúc này"],
  };

  return {
    profile,
    now,
    unreadCount,
    notifications,
    departmentMembers,
    countByStatus,
    activeTasks,
    dueToday,
    overdue,
    topUrgentTasks,
    nearestDeadline,
    employeeEstimate,
    employeeTasks,
    kpiByUser,
    departmentRows,
    companyAvg,
    forecast,
    formatMonthLabel,
    formatRelativeDeadline,
    normalizeName,
  };
}

export async function DashboardHomeShell() {
  const data = await loadDashboardHomeData();
  const roleMeta = ROLE_META[data.profile.role];
  const navItems = getNavItems(data.profile.role);
  const actionItems = getActionItems(data.profile.role);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_40%,_#f8fafc_100%)] px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <NotificationToast />
        <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className={`bg-gradient-to-br ${roleMeta.accent} p-5 text-white`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">WorkKPI</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight">{data.normalizeName(data.profile)}</h1>
                </div>
                <div className={`rounded-2xl border border-white/15 px-3 py-2 text-xs font-semibold ${roleMeta.badge} bg-white/10 text-white backdrop-blur-sm`}>
                  {data.profile.role}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/80">
                {data.profile.department?.name ?? "Chưa gán phòng"}
                {data.profile.team?.name ? ` · ${data.profile.team.name}` : ""}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                {navItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    description={item.description}
                    active={item.href === "/dashboard"}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Today</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">Phiên làm việc hiện tại</h2>
                </div>
                <div className="grid gap-3">
                  <WorkspaceStat label="Unread" value={`${data.unreadCount > 99 ? "99+" : data.unreadCount}`} />
                  <WorkspaceStat label="Active tasks" value={String(data.activeTasks.length)} />
                  <WorkspaceStat label="Due today" value={String(data.dueToday.length)} />
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick actions</p>
                <div className="mt-4 grid gap-2">
                  {actionItems.map((action) => (
                    <ActionLink key={action.href} href={action.href} label={action.label} variant={action.variant} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className={`h-2 bg-gradient-to-r ${roleMeta.accent}`} />
            <div className="p-4 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                      {roleMeta.caption}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${roleMeta.badge}`}>
                      {data.formatMonthLabel(data.now)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {data.profile.department?.name ?? "No department"}
                      {data.profile.team?.name ? ` · ${data.profile.team.name}` : ""}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {roleMeta.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                      {roleMeta.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ActionLink href="/dashboard/tasks/new" label="Create work item" />
                    <ActionLink href="/dashboard/tasks" label="Open tasks" variant="outline" />
                    <ActionLink href="/dashboard/reports/monthly" label="View reports" variant="ghost" />
                  </div>
                </div>

                <div className={`min-w-[280px] rounded-[1.75rem] bg-gradient-to-br ${roleMeta.accent} p-5 text-white shadow-[0_20px_70px_rgba(15,23,42,0.24)]`}>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">Workspace snapshot</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <WorkspaceStat label="Unread" value={`${data.unreadCount > 99 ? "99+" : data.unreadCount}`} inverted />
                    <WorkspaceStat
                      label="KPI est."
                      value={
                        data.profile.role === "EMPLOYEE"
                          ? `${data.employeeEstimate.totalScore.toFixed(1)}`
                          : `${data.companyAvg?.toFixed(1) ?? "-"}`
                      }
                      inverted
                    />
                    <WorkspaceStat label="Due today" value={String(data.dueToday.length)} inverted />
                    <WorkspaceStat label="Overdue" value={String(data.overdue.length)} inverted />
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/85 backdrop-blur-sm">
                    {data.profile.role === "ADMIN"
                      ? "Quản trị user, phòng ban và session từ một control center duy nhất."
                      : data.profile.role === "DIRECTOR"
                        ? "Điều hành bằng tín hiệu KPI và các điểm nghẽn đang ảnh hưởng đến hiệu suất công ty."
                        : data.profile.role === "MANAGER"
                          ? "Theo dõi team, ưu tiên task gần deadline và bóc tách rủi ro vận hành."
                          : data.profile.role === "LEADER"
                            ? "Nhìn được tiến độ team, thông báo và điểm cần review ngay trong phiên làm việc."
                            : "Tập trung vào task cá nhân, thông báo và tiến độ trong ngày."}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-6 lg:p-7">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Command center</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Tìm nhanh, thao tác nhanh, quay lại làm việc nhanh</h3>
              </div>
              <div className="w-full sm:max-w-xl">
                <GlobalSearch />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <NotificationBell initialUnreadCount={data.unreadCount} initialNotifications={data.notifications} />
                <SignOutButton />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">KPI tháng hiện tại</div>
                <div className="text-lg font-semibold text-slate-950">{data.formatMonthLabel(data.now)}</div>
              </div>
            </div>
          </div>

          <DashboardView
            role={data.profile.role}
            profileName={data.normalizeName(data.profile)}
            departmentName={data.profile.department?.name ?? null}
            teamName={data.profile.team?.name ?? null}
            unreadCount={data.unreadCount}
            notifications={data.notifications}
            summary={{
              activeTasks: data.activeTasks.length,
              dueToday: data.dueToday.length,
              overdue: data.overdue.length,
              kpiEstimate: data.profile.role === "EMPLOYEE" ? data.employeeEstimate.totalScore : data.companyAvg,
              nearestDeadline: data.nearestDeadline
                ? {
                    title: data.nearestDeadline.title,
                    deadline: data.formatRelativeDeadline(data.nearestDeadline.deadline),
                    assignees: data.nearestDeadline.assignees.map((assignment) =>
                      data.normalizeName(assignment.assignee)
                    ),
                    status: data.nearestDeadline.status,
                  }
                : null,
            }}
            statusCounts={data.countByStatus}
            tasks={
              data.profile.role === "DIRECTOR" || data.profile.role === "ADMIN"
                ? []
                : data.topUrgentTasks.map((task) => ({
                    id: task.id,
                    title: task.title,
                    deadline: data.formatRelativeDeadline(task.deadline),
                    priority: task.priority,
                    progressPercent: task.progressPercent,
                    assignees: task.assignees.map((assignment) => data.normalizeName(assignment.assignee)),
                    status: task.status,
                  }))
            }
            members={
              data.profile.role === "DIRECTOR" || data.profile.role === "ADMIN"
                ? []
                : data.departmentMembers.map((member) => ({
                    id: member.id,
                    name: data.normalizeName(member),
                    role: member.role,
                    departmentName: member.department?.name ?? data.profile.department?.name ?? null,
                    kpi: data.kpiByUser.get(member.id)?.totalScore ?? null,
                    onTimeRate: data.kpiByUser.get(member.id)?.onTimeRate ?? null,
                  }))
            }
            departments={data.departmentRows}
            companyAvg={data.companyAvg}
            forecast={data.forecast}
            topPerformers={Array.from(data.kpiByUser.values())
              .filter((item) => item.totalScore != null)
              .sort((a, b) => b.totalScore - a.totalScore)
              .slice(0, 5)
              .map((item) => ({
                name: item.name,
                departmentName: item.departmentName,
                score: item.totalScore,
                grade: item.grade,
              }))}
            bottomPerformers={Array.from(data.kpiByUser.values())
              .filter((item) => item.totalScore != null)
              .sort((a, b) => a.totalScore - b.totalScore)
              .slice(0, 5)
              .map((item) => ({
                name: item.name,
                departmentName: item.departmentName,
                score: item.totalScore,
                grade: item.grade,
              }))}
          />
        </section>
      </div>
    </main>
  );
}