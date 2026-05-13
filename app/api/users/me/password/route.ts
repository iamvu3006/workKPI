import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit-logger";
import { createNotification } from "@/lib/notifications";
import { getPasswordStrength } from "@/lib/password/strength";
import { changePasswordSchema } from "@/lib/profile/validation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    const strength = getPasswordStrength(newPassword);

    if (!strength.isStrongEnough) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới chưa đủ mạnh." },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ người dùng." },
        { status: 404 }
      );
    }

    const verification = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (verification.error || !verification.data.user) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu hiện tại không chính xác." },
        { status: 400 }
      );
    }

    const updateResult = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateResult.error) {
      return NextResponse.json(
        { success: false, error: "Không thể đổi mật khẩu." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actorUserId: user.id,
      action: "password_changed" as any,
      entityType: "profile",
      entityId: user.id,
      metadata: {
        strength: strength.label,
      },
    });

    await createNotification({
      userId: user.id,
      type: "security.password_changed",
      title: "Mật khẩu đã được thay đổi",
      body: "Mật khẩu tài khoản của bạn vừa được cập nhật thành công.",
      payload: {
        changedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        passwordChanged: true,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể đổi mật khẩu." },
      { status: 500 }
    );
  }
}