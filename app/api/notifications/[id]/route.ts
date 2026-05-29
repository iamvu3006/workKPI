import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Thông báo không tồn tại hoặc không có quyền." }, { status: 404 });
    }

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { deleted: id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Không thể xóa thông báo." }, { status: 500 });
  }
}
