import Link from "next/link";

import { KpiForecastWidget } from "@/components/dashboard/kpi-forecast-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardRole = "EMPLOYEE" | "MANAGER" | "LEADER" | "DIRECTOR" | "ADMIN";

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
  TO_DO: "Việc cần làm",
  IN_PROGRESS: "Đang làm",
  PENDING: "Tạm dừng",
  REVIEW: "Chờ duyệt",
  DONE: "Đã xong",
  CANCELLED: "Đã hủy",
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
  ADMIN: "Quản trị viên",
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

  return <span className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${toneClass}`} />;
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
    <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
      <CardContent className="p-4.5">
        <div className="flex items-start gap-2.5">
          <ToneDot tone={tone} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 truncate">{note}</p>
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
    <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-500">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const badgeStyle = {
    DONE: "bg-teal-50 text-teal-700 border-teal-200/50 hover:bg-teal-50",
    REVIEW: "bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-50",
    PENDING: "bg-slate-100 text-slate-600 border-slate-200/50 hover:bg-slate-100",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-50",
    TO_DO: "bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-50",
    CANCELLED: "bg-rose-50 text-rose-600 border-rose-200/50 hover:bg-rose-50",
  }[status] ?? "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${badgeStyle}`}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function OverviewMetricRow({ counts }: { counts: Record<string, number> }) {
  const items = [
    { key: "TO_DO", label: "Cần làm" },
    { key: "IN_PROGRESS", label: "Đang làm" },
    { key: "PENDING", label: "Tạm dừng" },
    { key: "REVIEW", label: "Chờ duyệt" },
    { key: "DONE", label: "Đã xong" },
  ];

  const total = items.reduce((sum, item) => sum + (counts[item.key] ?? 0), 0);

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const count = counts[item.key] ?? 0;
        const width = total > 0 ? Math.max(6, Math.round((count / total) * 100)) : 0;
        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{item.label}</span>
              <span className="font-bold text-slate-800">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-300"
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
    return <p className="text-xs text-slate-400 py-2">Chưa có công việc nổi bật trong phạm vi này.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-slate-200 transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 truncate">{task.title}</h3>
              <p className="mt-1 text-[10px] text-slate-400 font-medium">
                {task.deadline} · Ưu tiên: {PRIORITY_LABELS[task.priority] ?? task.priority}
              </p>
            </div>
            <StatusPill status={task.status} />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500">
            {task.assignees.slice(0, 3).map((assignee) => (
              <span key={assignee} className="rounded-md border border-slate-200/50 bg-white px-2 py-0.5 font-medium">
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
    return <p className="text-xs text-slate-400 py-2">Chưa có dữ liệu thành viên.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold">
            <tr>
              <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]">Thành viên</th>
              <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]">Vai trò</th>
              <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]">Phòng ban</th>
              <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]">KPI</th>
              <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]">Đúng hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-3.5 py-2.5 text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-teal-800">
                      {initials(member.name)}
                    </div>
                    <span className="font-semibold text-xs truncate max-w-[120px]">{member.name}</span>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-slate-500 font-medium">{member.role}</td>
                <td className="px-3.5 py-2.5 text-slate-500 font-medium">{member.departmentName ?? "-"}</td>
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{formatScore(member.kpi)}</td>
                <td className="px-3.5 py-2.5 text-slate-500 font-bold">{formatPercent(member.onTimeRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentTable({ departments }: { departments: DepartmentItem[] }) {
  if (departments.length === 0) {
    return <p className="text-xs text-slate-400 py-2">Chưa có dữ liệu phòng ban cho tháng này.</p>;
  }

  return (
    <div className="grid gap-2">
      {departments.map((department) => (
        <div key={department.name} className="rounded-xl border border-slate-150 bg-slate-50/50 p-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800">{department.name}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{department.members} thành viên có KPI tháng</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-slate-950">{formatScore(department.avgKpi)}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">KPI trung bình</div>
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
    return <p className="text-xs text-slate-400 py-2">Chưa có kết quả KPI để xếp hạng.</p>;
  }

  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={`${row.name}-${index}`}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-slate-200 transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-slate-800">
                {index + 1}. {row.name}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.departmentName ?? "Toàn công ty"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">{formatScore(row.score)}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">{row.grade}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function NotificationPreview({ notifications }: { notifications: NotificationItem[] }) {
  if (notifications.length === 0) {
    return <p className="text-xs text-slate-400 py-2">Không có thông báo mới.</p>;
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-xl border p-3.5 transition-colors ${
            notification.readAt 
              ? "border-slate-100 bg-white" 
              : "border-teal-500/10 bg-teal-500/5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">{notification.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{notification.body}</p>
            </div>
            <span className="text-[9px] text-slate-400 shrink-0 font-medium">
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
    <div className="mt-1 space-y-5">
      {/* 4 Dashboard Metric Cards */}
      <section className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Thông báo chưa đọc"
          value={`${unreadCount > 99 ? "99+" : unreadCount}`}
          note="Refresh thời gian thực khi có tín hiệu mới."
          tone="rose"
        />
        <MetricCard
          label="Task đang hoạt động"
          value={String(summary.activeTasks)}
          note="Chưa tính các task đã DONE hoặc CANCELLED."
          tone="teal"
        />
        <MetricCard
          label="Đến hạn hôm nay"
          value={String(summary.dueToday)}
          note="Cần ưu tiên xử lý ngay để tránh trễ hạn."
          tone="amber"
        />
        <MetricCard
          label="Task quá hạn (Overdue)"
          value={String(summary.overdue)}
          note="Vượt quá ngày hoàn thành, đang trừ điểm KPI."
          tone="slate"
        />
      </section>

      {/* Main KPI and Status charts */}
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title={
            role === "EMPLOYEE"
              ? "Điểm hiệu suất ước tính"
              : role === "LEADER"
                ? "Tổng quan KPI Nhóm"
                : role === "MANAGER"
                  ? "Tổng quan KPI Phòng ban"
                  : "KPI Trung bình toàn công ty"
          }
          description={
            role === "EMPLOYEE"
              ? "Dự phóng dựa trên các công việc đã hoàn thành và tiến độ thực tế."
              : role === "LEADER"
                ? `Nhóm ${teamName ?? "chưa đặt tên"} · ${departmentName ?? "Chưa gán phòng"}`
                : role === "MANAGER"
                  ? `Phòng ban ${departmentName ?? "Chưa gán"}`
                  : `Quyền hạn quan sát: ${ROLE_LABELS[role]}`
          }
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-lg h-8 text-[11px] font-semibold cursor-pointer">
              <Link href="/dashboard/notifications">Mở toàn bộ hộp thư</Link>
            </Button>
          }
        >
          {role === "DIRECTOR" || role === "ADMIN" ? (
            <div className="space-y-4">
              {/* Minimal Dark Slate Box instead of choy gradients */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5.5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-teal-500/10 to-transparent blur-lg rounded-bl-full" />
                <p className="text-[10px] uppercase tracking-wider text-teal-300 font-bold">KPI Trung bình toàn công ty</p>
                <div className="mt-2 text-4xl font-extrabold tracking-tight">{formatScore(companyAvg)}</div>
                <p className="mt-2.5 max-w-xl text-xs text-slate-400 leading-relaxed">
                  Bảng xếp hạng phòng ban và top nhân sự xuất sắc được tổng hợp trực tiếp từ hồ sơ KPI hoạt động tháng này.
                </p>
              </div>
              <DepartmentTable departments={departments} />
            </div>
          ) : (
            <div className="grid gap-4.5 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Dark Minimal Slate Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5.5 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-teal-500/10 to-transparent blur-md rounded-bl-full" />
                <div>
                  <span className="inline-flex items-center rounded-lg bg-teal-500/10 px-2 py-0.5 text-[9px] font-bold text-teal-400 border border-teal-500/20">
                    {ROLE_LABELS[role]}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-3">KPI ước tính tháng này</p>
                  <div className="mt-1.5 text-4xl font-extrabold tracking-tight text-teal-400">{formatScore(summary.kpiEstimate)}</div>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {role === "EMPLOYEE"
                      ? "Điểm tổng dựa trên tỷ trọng và mức độ hoàn thành task hiện tại."
                      : role === "LEADER"
                        ? "Điểm trung bình hoạt động của các thành viên trong nhóm."
                        : "Điểm trung bình hoạt động của toàn bộ phòng ban."}
                  </p>
                </div>
                {summary.nearestDeadline ? (
                  <div className="mt-4.5 rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[9px] uppercase tracking-wider text-teal-300 font-bold">Mốc trễ gần nhất</p>
                    <p className="mt-1 text-xs font-bold text-slate-100 truncate">{summary.nearestDeadline.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-300 font-medium">{summary.nearestDeadline.deadline}</p>
                    <p className="mt-1 text-[9px] text-teal-300/80 font-bold truncate">
                      {summary.nearestDeadline.assignees.join(", ") || "Chưa gán nhân sự"}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Light Status Details */}
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-2.5">Trạng thái công việc</p>
                  <OverviewMetricRow counts={statusCounts} />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-2.5">Tín hiệu thông báo gần đây</p>
                  <NotificationPreview notifications={notifications} />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Forecast widget (Cleaned internally inside its own component) */}
        <KpiForecastWidget
          title={forecast.title}
          description={forecast.description}
          scenarios={forecast.scenarios}
          suggestions={forecast.suggestions}
        />
      </section>

      {/* Dynamic Task lists / Member performance lists based on roles */}
      {(role === "EMPLOYEE" || role === "LEADER" || role === "MANAGER") && (
        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title={role === "EMPLOYEE" ? "Công việc khẩn cần xử lý" : "Danh sách công việc đang giám sát"}
            description="Các task có thời gian hoàn thành gần nhất trong phạm vi quyền hạn của bạn."
          >
            <MiniTaskList tasks={tasks} />
          </SectionCard>

          <SectionCard
            title={role === "EMPLOYEE" ? "Tỷ lệ các trạng thái" : "Danh sách nhân sự cần chú ý"}
            description={
              role === "EMPLOYEE"
                ? "Thống kê cấu trúc các công việc đã thực hiện trong tháng."
                : "KPI thực tế và tỷ lệ đúng hạn của các thành viên trực thuộc quản lý."
            }
          >
            {role === "EMPLOYEE" ? <OverviewMetricRow counts={statusCounts} /> : <MemberTable members={members} />}
          </SectionCard>
        </section>
      )}

      {/* Leaders / Director Rank Panels */}
      {role === "DIRECTOR" || role === "ADMIN" ? (
        <section className="grid gap-5 xl:grid-cols-2">
          <PerformerTable
            title="Nhóm nhân viên xuất sắc"
            description="Top 5 nhân sự có điểm KPI cao nhất trong tháng."
            rows={topPerformers}
          />
          <PerformerTable
            title="Nhân viên cần cải thiện hiệu suất"
            description="Top 5 nhân sự có điểm KPI thấp nhất trong tháng."
            rows={bottomPerformers}
          />
        </section>
      ) : null}
    </div>
  );
}