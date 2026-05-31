import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardView, type DashboardRole } from "@/components/dashboard/dashboard-view";
import { Button } from "@/components/ui/button";
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
    caption: "Bàn làm việc",
    title: "Tập trung vào việc cần làm ngay",
    description: "Theo dõi task cá nhân, thông báo, KPI ước tính và các mốc sắp đến trong một màn hình gọn gàng.",
    accent: "from-teal-600 to-cyan-600",
    badge: "bg-teal-50/80 text-teal-700 border-teal-200/50",
  },
  LEADER: {
    caption: "Điều hành nhóm",
    title: "Điều phối team theo nhịp làm việc rõ ràng",
    description: "Xem task của team, trạng thái thành viên và các tín hiệu cần xử lý trước khi chúng thành rủi ro.",
    accent: "from-blue-600 to-indigo-600",
    badge: "bg-blue-50/80 text-blue-700 border-blue-200/50",
  },
  MANAGER: {
    caption: "Quản lý phòng ban",
    title: "Quản lý phòng ban với dữ liệu trực quan",
    description: "Tập trung vào KPI phòng, luồng task, và tình hình vận hành trong phạm vi phụ trách.",
    accent: "from-amber-600 to-orange-600",
    badge: "bg-amber-50/80 text-amber-700 border-amber-200/50",
  },
  DIRECTOR: {
    caption: "Nhịp sinh học công ty",
    title: "Nhìn toàn công ty trong một nhịp điều hành",
    description: "Theo dõi KPI, thứ tự ưu tiên và chất lượng thực thi trên toàn tổ chức.",
    accent: "from-slate-900 to-slate-800",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  ADMIN: {
    caption: "Trung tâm quản trị",
    title: "Bảng điều khiển dành cho vận hành và cấu hình",
    description: "Điều phối người dùng, phòng ban, phiên đăng nhập, và các tín hiệu bảo mật trên một workspace tinh gọn.",
    accent: "from-violet-600 to-indigo-600",
    badge: "bg-violet-50/80 text-violet-700 border-violet-200/50",
  },
} satisfies Record<DashboardRole, { caption: string; title: string; description: string; accent: string; badge: string }>;

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
    <Button asChild variant={variant} size="sm" className="rounded-xl px-4 font-semibold text-xs h-9 cursor-pointer">
      <Link href={href}>{label}</Link>
    </Button>
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
  const roleMeta = ROLE_META[data.profile.role as DashboardRole];

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {/* Clean Role Welcome Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                {roleMeta.caption}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal-50/80 text-teal-700 border-teal-200/50`}>
                {data.formatMonthLabel(data.now)}
              </span>
              <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[9px] font-semibold text-slate-500">
                {data.profile.department?.name ?? "Không thuộc phòng ban"}
                {data.profile.team?.name ? ` · ${data.profile.team.name}` : ""}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                {roleMeta.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                {roleMeta.description}
              </p>
            </div>
          </div>

          {/* Inline Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <ActionLink href="/dashboard/tasks/new" label="Tạo công việc" />
            <ActionLink href="/dashboard/tasks" label="Mở danh sách Tasks" variant="outline" />
            <ActionLink href="/dashboard/reports/monthly" label="Xem báo cáo" variant="ghost" />
            <ActionLink href="/dashboard/ai" label="Trợ lý AI" variant="ghost" />
          </div>
        </div>
      </div>

      {/* Active Data Dashboard Area */}
      <DashboardView
        role={data.profile.role as DashboardRole}
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
    </div>
  );
}