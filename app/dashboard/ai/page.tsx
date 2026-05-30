import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AiChat } from "@/components/ai/ai-chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">AI Assistant</h1>
            <Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 text-teal-700">
              {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}
            </Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Xin chào {displayName}. Trợ lý này chỉ dùng dữ liệu nằm trong phạm vi quyền của bạn và lưu lại lịch sử cuộc trò chuyện của chính bạn.
          </p>
        </div>

        <Card className="border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <CardContent className="flex flex-wrap gap-3 p-4 text-sm text-slate-600">
            <span>Phòng ban: {profile.department?.name || "Không có"}</span>
            <span>·</span>
            <span>Nhóm: {profile.team?.name || "Không có"}</span>
          </CardContent>
        </Card>

        <AiChat />
      </div>
    </main>
  );
}