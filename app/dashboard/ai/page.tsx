import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AiChat } from "@/components/ai/ai-chat";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

const ROLE_LABELS = {
  ADMIN: "Quản trị viên",
  DIRECTOR: "Giám đốc",
  MANAGER: "Trưởng phòng",
  LEADER: "Trưởng nhóm",
  EMPLOYEE: "Nhân viên",
} as const;

export default async function AiAssistantPage() {
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
      role: true,
      status: true,
      fullName: true,
      displayName: true,
      department: { select: { name: true } },
      team: { select: { name: true } },
    },
  });

  if (!profile || profile.status !== "ACTIVE") {
    redirect("/auth/login");
  }

  const displayName = profile.displayName || profile.fullName || user.email || "Người dùng";

  return (
    <div className="flex flex-col gap-5">
      {/* Premium Welcome Header Box */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trợ lý Trí tuệ Nhân tạo AI</h1>
          <Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
            {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}
          </Badge>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
          Xin chào <span className="font-semibold text-slate-800">{displayName}</span>. Trợ lý thông minh này được huấn luyện đặc thù để hỗ trợ phân tích dữ liệu, gợi ý công việc và tính toán KPI trong phạm vi quyền hạn của bạn. Lịch sử trò chuyện được lưu trữ bảo mật của riêng bạn.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Phòng ban: <strong className="text-slate-700">{profile.department?.name || "Không có"}</strong></span>
          <span>·</span>
          <span>Nhóm: <strong className="text-slate-700">{profile.team?.name || "Không có"}</strong></span>
        </div>
      </div>

      {/* Main Chat Box */}
      <AiChat />
    </div>
  );
}