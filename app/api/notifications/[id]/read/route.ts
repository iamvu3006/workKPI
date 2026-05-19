import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Thông báo không tồn tại hoặc không có quyền." }, { status: 404 });
    }

    if (notification.readAt) {
      return NextResponse.json({ success: true, data: { isRead: true } });
    }

    const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() }, select: { id: true, readAt: true } });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Không thể đánh dấu thông báo." }, { status: 500 });
  }
}
