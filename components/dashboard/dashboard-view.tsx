import Link from "next/link";

import { KpiForecastWidget } from "@/components/dashboard/kpi-forecast-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardRole = "EMPLOYEE" | "MANAGER" | "LEADER" | "DIRECTOR" | "ADMIN";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

type TaskItem = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  progressPercent: number;
  assignees: string[];
  status: string;
};

type MemberItem = {
  id: string;
  name: string;
  role: string;
  departmentName: string | null;
  kpi: number | null;
  onTimeRate: number | null;
};

type DepartmentItem = {
  name: string;
  avgKpi: number | null;
  members: number;
};

type PerformerItem = {
  name: string;
  departmentName: string | null;
  score: number;
  grade: string;
};

type DashboardViewProps = {
  role: DashboardRole;
  profileName: string;
  departmentName: string | null;
  teamName: string | null;
  unreadCount: number;
  notifications: NotificationItem[];
  summary: {
    activeTasks: number;
    dueToday: number;
    overdue: number;
    kpiEstimate: number | null;
    nearestDeadline: {
      title: string;
      deadline: string;
      assignees: string[];
      status: string;
    } | null;
  };
  statusCounts: Record<string, number>;
  tasks: TaskItem[];
  members: MemberItem[];
  departments: DepartmentItem[];
  companyAvg: number | null;
  forecast: {
    title: string;
    description: string;
    scenarios: { label: string; score: number; detail: string }[];
    suggestions: string[];
  };
  topPerformers: PerformerItem[];
  bottomPerformers: PerformerItem[];
};

const STATUS_LABELS: Record<string, string> = {
  TO_DO: "To-Do",
  IN_PROGRESS: "In Progress",
  PENDING: "Pending",
  REVIEW: "Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Thấp",
  NORMAL: "Bình thường",
  HIGH: "Cao",
  URGENT: "Khẩn",
};

const ROLE_LABELS: Record<DashboardRole, string> = {
  EMPLOYEE: "Nhân viên",
  LEADER: "Leader",
  MANAGER: "Trưởng phòng",
  DIRECTOR: "Ban giám đốc",
  ADMIN: "Quản trị",
};

function formatScore(score: number | null) {
  if (score === null) return "Chưa có";
  return `${score.toFixed(1)} điểm`;
}

function formatPercent(value: number | null) {
  if (value === null) return "-";
  return `${value.toFixed(0)}%`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ToneDot({ tone }: { tone: "teal" | "amber" | "rose" | "slate" }) {
  const toneClass = {
    teal: "bg-teal-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
  }[tone];

  return <span className={`mt-1 inline-block size-2 rounded-full ${toneClass}`} />;
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "teal" | "amber" | "rose" | "slate";
}) {
  return (
    <Card className="border-slate-200 bg-white/90">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <ToneDot tone={tone} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 bg-white/95 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-slate-200 px-6 py-5">
        <div>
          <CardTitle className="text-base text-slate-950">{title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "DONE"
      ? "success"
      : status === "REVIEW"
        ? "warning"
        : status === "PENDING"
          ? "secondary"
          : status === "IN_PROGRESS"
            ? "accent"
            : "default";

  return <Badge variant={tone as never}>{STATUS_LABELS[status] ?? status}</Badge>;
}

function OverviewMetricRow({ counts }: { counts: Record<string, number> }) {
  const items = [
    { key: "TO_DO", label: "To-Do" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "PENDING", label: "Pending" },
    { key: "REVIEW", label: "Review" },
    { key: "DONE", label: "Done" },
  ];

  const total = items.reduce((sum, item) => sum + (counts[item.key] ?? 0), 0);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const count = counts[item.key] ?? 0;
        const width = total > 0 ? Math.max(6, Math.round((count / total) * 100)) : 0;
        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-900">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniTaskList({ tasks }: { tasks: TaskItem[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có task nổi bật trong phạm vi này.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium text-slate-950">{task.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {task.deadline} · {PRIORITY_LABELS[task.priority] ?? task.priority}
              </p>
            </div>
            <StatusPill status={task.status} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {task.assignees.slice(0, 3).map((assignee) => (
              <span key={assignee} className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                {assignee}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberTable({ members }: { members: MemberItem[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có dữ liệu thành viên trong phạm vi này.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Thành viên</th>
            <th className="px-4 py-3 text-left font-medium">Vai trò</th>
            <th className="px-4 py-3 text-left font-medium">Phòng</th>
            <th className="px-4 py-3 text-left font-medium">KPI tháng</th>
            <th className="px-4 py-3 text-left font-medium">On-time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-4 py-3 text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                    {initials(member.name)}
                  </div>
                  <span className="font-medium">{member.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{member.role}</td>
              <td className="px-4 py-3 text-slate-600">{member.departmentName ?? "-"}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{formatScore(member.kpi)}</td>
              <td className="px-4 py-3 text-slate-600">{formatPercent(member.onTimeRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepartmentTable({ departments }: { departments: DepartmentItem[] }) {
  if (departments.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có dữ liệu phòng ban cho tháng này.</p>;
  }

  return (
    <div className="grid gap-3">
      {departments.map((department) => (
        <div key={department.name} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-slate-950">{department.name}</h3>
              <p className="text-sm text-slate-500">{department.members} thành viên có KPI tháng</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-950">{formatScore(department.avgKpi)}</div>
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">KPI trung bình</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformerTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: PerformerItem[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có kết quả KPI để xếp hạng.</p>;
  }

  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${row.name}-${index}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <div>
              <div className="font-medium text-slate-950">
                {index + 1}. {row.name}
              </div>
              <div className="text-sm text-slate-500">{row.departmentName ?? "Toàn công ty"}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-950">{formatScore(row.score)}</div>
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{row.grade}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function NotificationPreview({ notifications }: { notifications: NotificationItem[] }) {
  if (notifications.length === 0) {
    return <p className="text-sm text-slate-500">Không có thông báo mới.</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-2xl border p-4 ${notification.readAt ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50/70"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-950">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
            </div>
            <span className="text-xs text-slate-400">
              {new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(notification.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardView({
  role,
  profileName,
  departmentName,
  teamName,
  unreadCount,
  notifications,
  summary,
  statusCounts,
  tasks,
  members,
  departments,
  companyAvg,
  forecast,
  topPerformers,
  bottomPerformers,
}: DashboardViewProps) {
  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Thông báo chưa đọc"
          value={`${unreadCount > 99 ? "99+" : unreadCount}`}
          note="Badge đồng bộ với inbox in-app và refresh khi focus tab."
          tone="rose"
        />
        <MetricCard
          label="Task đang hoạt động"
          value={String(summary.activeTasks)}
          note="Chỉ tính task chưa DONE/CANCELLED trong phạm vi role hiện tại."
          tone="teal"
        />
        <MetricCard
          label="Đến hạn hôm nay"
          value={String(summary.dueToday)}
          note="Những task cần xử lý ngay để tránh trễ deadline."
          tone="amber"
        />
        <MetricCard
          label="Overdue"
          value={String(summary.overdue)}
          note={
            role === "EMPLOYEE"
              ? "KPI ước tính cá nhân lấy từ task hiện tại."
              : "Số task quá hạn trong phạm vi xem."
          }
          tone="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <SectionCard
          title={
            role === "EMPLOYEE"
              ? "Ước tính KPI tháng"
              : role === "LEADER"
                ? "Tổng quan team"
                : role === "MANAGER"
                  ? "Tổng quan phòng"
                  : "Tổng quan toàn công ty"
          }
          description={
            role === "EMPLOYEE"
              ? "Kết quả dự phóng theo task DONE và task đang tiến hành."
              : role === "LEADER"
                ? `Team ${teamName ?? "chưa có tên"} · ${departmentName ?? "Chưa gán phòng"}`
                : role === "MANAGER"
                  ? `Phòng ${departmentName ?? "Chưa gán"} · phạm vi dữ liệu đã được giới hạn`
                  : `Phạm vi xem theo vai trò ${ROLE_LABELS[role]}`
          }
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/notifications">Xem toàn bộ thông báo</Link>
            </Button>
          }
        >
          {role === "DIRECTOR" || role === "ADMIN" ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.18em] text-teal-200">KPI trung bình toàn công ty</p>
                <div className="mt-3 text-5xl font-semibold tracking-tight">{formatScore(companyAvg)}</div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Bảng xếp hạng phòng ban và top nhân viên được lấy từ KPI tháng hiện tại.
                </p>
              </div>
              <DepartmentTable departments={departments} />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-teal-950 via-teal-800 to-cyan-700 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.18em] text-teal-100">{ROLE_LABELS[role]}</p>
                <div className="mt-3 text-5xl font-semibold tracking-tight">{formatScore(summary.kpiEstimate)}</div>
                <p className="mt-3 text-sm leading-6 text-teal-50/90">
                  {role === "EMPLOYEE"
                    ? "Ước tính dựa trên task DONE và task đang tiến hành của riêng bạn."
                    : role === "LEADER"
                      ? "KPI trung bình team và tình trạng task của các thành viên trong team."
                      : "KPI trung bình phòng và trạng thái task đang được quản lý."}
                </p>
                {summary.nearestDeadline ? (
                  <div className="mt-5 rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-teal-100">Deadline gần nhất</p>
                    <p className="mt-2 font-medium">{summary.nearestDeadline.title}</p>
                    <p className="mt-1 text-sm text-teal-50/90">{summary.nearestDeadline.deadline}</p>
                    <p className="mt-1 text-xs text-teal-100/90">
                      {summary.nearestDeadline.assignees.join(", ") || "Chưa có assignee"}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-700">Trạng thái task</p>
                  <OverviewMetricRow counts={statusCounts} />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-700">Thông báo gần đây</p>
                  <div className="mt-3">
                    <NotificationPreview notifications={notifications} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

      <KpiForecastWidget
        title={forecast.title}
        description={forecast.description}
        scenarios={forecast.scenarios}
        suggestions={forecast.suggestions}
      />

        <SectionCard
          title="Mốc cần chú ý"
          description="3 thông tin ưu tiên để xử lý ngay trong phiên làm việc hiện tại."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-700">Thông báo chưa đọc</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{unreadCount}</p>
            </div>
            {summary.nearestDeadline ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-slate-700">Deadline gần nhất</p>
                <p className="mt-2 font-medium text-slate-950">{summary.nearestDeadline.title}</p>
                <p className="mt-1 text-sm text-slate-600">{summary.nearestDeadline.deadline}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                Chưa có task nào trong phạm vi hiện tại.
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-700">Phạm vi hiện tại</p>
              <p className="mt-2 text-sm text-slate-600">{profileName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {departmentName ?? "Chưa gán phòng"}{teamName ? ` · ${teamName}` : ""}
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      {(role === "EMPLOYEE" || role === "LEADER" || role === "MANAGER") && (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title={role === "EMPLOYEE" ? "Task cần xử lý gấp" : "Task phạm vi hiện tại"}
            description="Danh sách task gần deadline nhất trong phạm vi role."
          >
            <MiniTaskList tasks={tasks} />
          </SectionCard>

          <SectionCard
            title={role === "EMPLOYEE" ? "Tỷ lệ trạng thái task" : "Danh sách thành viên cần chú ý"}
            description={
              role === "EMPLOYEE"
                ? "Cấu trúc trạng thái trong tháng hiện tại."
                : "KPI tháng và on-time rate của các thành viên trong phạm vi quản lý."
            }
          >
            {role === "EMPLOYEE" ? <OverviewMetricRow counts={statusCounts} /> : <MemberTable members={members} />}
          </SectionCard>
        </section>
      )}

      {role === "DIRECTOR" || role === "ADMIN" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <PerformerTable
            title="Top nhân viên xuất sắc"
            description="Xếp hạng theo KPI tháng hiện tại."
            rows={topPerformers}
          />
          <PerformerTable
            title="Nhân viên cần cải thiện"
            description="5 người có KPI thấp nhất trong tháng hiện tại."
            rows={bottomPerformers}
          />
        </section>
      ) : null}
    </div>
  );
}