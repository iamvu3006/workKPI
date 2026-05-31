"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashboardRole = "EMPLOYEE" | "LEADER" | "MANAGER" | "DIRECTOR" | "ADMIN";

function getNavItems(role: DashboardRole) {
  const base = [
    { href: "/dashboard", label: "Tổng quan", description: "Bảng điều khiển chính" },
    { href: "/dashboard/tasks", label: "Công việc", description: "Danh sách và luồng xử lý" },
    { href: "/dashboard/notifications", label: "Thông báo", description: "Tín hiệu hoạt động" },
    { href: "/dashboard/ai", label: "Trợ lý AI", description: "Hỏi đáp và trợ giúp công việc" },
    { href: "/dashboard/profile", label: "Cá nhân", description: "Hồ sơ của bạn" },
  ];

  if (role === "EMPLOYEE") {
    return [
      ...base,
      { href: "/dashboard/kpi", label: "Điểm KPI", description: "Theo dõi hiệu suất" },
      { href: "/dashboard/reports/monthly", label: "Báo cáo", description: "Thống kê tháng" },
    ];
  }

  if (role === "LEADER") {
    return [
      ...base,
      { href: "/dashboard/kpi/department", label: "KPI Team", description: "Hiệu suất nhóm" },
      { href: "/dashboard/reports/weekly", label: "Báo cáo tuần", description: "Nhịp làm việc tuần" },
      { href: "/dashboard/reports/monthly", label: "Báo cáo tháng", description: "Tổng hợp hiệu suất" },
    ];
  }

  if (role === "MANAGER") {
    return [
      ...base,
      { href: "/dashboard/kpi/department", label: "KPI Phòng", description: "Hiệu suất phòng ban" },
      { href: "/dashboard/reports/company", label: "Báo cáo chung", description: "Góc nhìn vận hành" },
      // { href: "/admin/departments", label: "Sơ đồ tổ chức", description: "Phòng ban & Team" },
    ];
  }

  if (role === "DIRECTOR") {
    return [
      ...base,
      { href: "/dashboard/kpi", label: "KPI Công ty", description: "Chỉ số toàn công ty" },
      { href: "/dashboard/reports/company", label: "Báo cáo tổng", description: "Bức tranh toàn cảnh" },
      { href: "/admin/users", label: "Thành viên", description: "Tài khoản nhân sự" },
    ];
  }

  return [
    ...base,
    { href: "/admin/users", label: "Quản trị User", description: "Danh sách tài khoản" },
    { href: "/admin/departments", label: "Quản trị Phòng", description: "Cấu trúc phòng ban" },
    { href: "/dashboard/reports/company", label: "Báo cáo hệ thống", description: "Thống kê dữ liệu" },
  ];
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
      className={`group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-150 ${
        active
          ? "border-teal-500/20 bg-teal-500/5 text-teal-700 font-semibold"
          : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <div>
        <span className="block text-xs font-semibold">{label}</span>
        <span className={`mt-0.5 block text-[10px] ${active ? "text-teal-600/80" : "text-slate-400 group-hover:text-slate-500"}`}>
          {description}
        </span>
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100 ${active ? "text-teal-600" : "text-slate-400"}`}>
        Mở
      </span>
    </Link>
  );
}

interface SidebarNavProps {
  role: DashboardRole;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <div className="grid gap-1">
      {navItems.map((item) => {
        // Handle active state dynamically:
        // /dashboard matches exactly
        // /dashboard/tasks matches startsWith /dashboard/tasks
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            description={item.description}
            active={isActive}
          />
        );
      })}
    </div>
  );
}
