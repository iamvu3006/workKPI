import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function resolveLink(notification: { type: string; payload: unknown }) {
  if (notification.payload && typeof notification.payload === "object" && notification.payload !== null) {
    const payload = notification.payload as { link?: string };
    if (typeof payload.link === "string" && payload.link.length > 0) {
      return payload.link;
    }
  }

  if (notification.type === "KPI_PUBLISHED") return "/dashboard/kpi";
  return "/dashboard/tasks";
}

export default async function NotificationsPage() {
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
    select: { id: true, displayName: true, fullName: true, email: true },
  });

  if (!profile) {
    redirect("/auth/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 90,
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

  const unreadCount = await prisma.notification.count({
    where: { userId: profile.id, readAt: null },
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Thông báo</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Lịch sử trong web</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bạn đang có {unreadCount} thông báo chưa đọc. Lịch sử này được lưu tối đa 90 ngày.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">← Dashboard</Link>
            </Button>
            <MarkAllReadButton />
          </div>
        </header>

        <Card className="border-slate-200 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base">Tất cả thông báo gần đây</CardTitle>
            <CardDescription>
              Click một thông báo để chuyển đến task hoặc trang liên quan. Thông báo chưa đọc được tô nổi bật.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Không có thông báo mới.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={resolveLink(notification)}
                    className={`block rounded-2xl border p-4 transition hover:border-teal-300 hover:bg-teal-50/60 ${
                      notification.readAt ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-medium text-slate-950">{notification.title}</h2>
                          {!notification.readAt ? <Badge variant="accent">Chưa đọc</Badge> : null}
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{notification.body}</p>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}