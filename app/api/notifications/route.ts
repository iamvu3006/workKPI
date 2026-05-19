import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")));
    const isReadParam = url.searchParams.get("isRead");

    const where: any = { userId: user.id };
    if (isReadParam === "true") where.readAt = { not: null };
    if (isReadParam === "false") where.readAt = null;

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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

    const unreadCount = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: { page, limit, total },
        unreadCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi khi tải thông báo." }, { status: 500 });
  }
}
