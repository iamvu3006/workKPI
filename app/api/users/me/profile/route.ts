import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";
import updateProfileSchema, {
  profileResponseSelect,
} from "@/lib/profile/validation";
import { writeAuditLog } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
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

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: profileResponseSelect as any,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ người dùng." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        displayName: profile.fullName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Lỗi khi tải hồ sơ." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updateData = parsed.data;
    const displayName = updateData.displayName ?? updateData.fullName;

    const updated = await prisma.profile.update({
      where: { id: user.id },
      data: {
        fullName: displayName,
        phone: updateData.phone,
      } as any,
      select: profileResponseSelect as any,
    });

    // Audit
    await writeAuditLog({
      actorUserId: user.id,
      action: "profile_updated" as any,
      entityType: "profile",
      entityId: user.id,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        displayName: updated.fullName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật hồ sơ." },
      { status: 500 }
    );
  }
}
