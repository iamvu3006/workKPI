import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit-logger";
import { prisma } from "@/lib/db/prisma";
import {
  buildAvatarStoragePath,
  buildVersionedPublicUrl,
  extractStoragePathFromPublicUrl,
  USER_AVATAR_BUCKET,
  validateAvatarFile,
} from "@/lib/profile/avatar";
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn một file ảnh." },
        { status: 400 }
      );
    }

    const validationError = validateAvatarFile(file);

    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true } as any,
    });

    const storagePath = buildAvatarStoragePath(user.id, file.type);
    const uploadResult = await supabase.storage
      .from(USER_AVATAR_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadResult.error) {
      return NextResponse.json(
        { success: false, error: "Không thể tải ảnh đại diện lên." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(USER_AVATAR_BUCKET)
      .getPublicUrl(uploadResult.data.path);

    const avatarUploadedAt = new Date();
    const versionedAvatarUrl = buildVersionedPublicUrl(
      publicUrlData.publicUrl,
      avatarUploadedAt.getTime().toString()
    );

    await prisma.profile.update({
      where: { id: user.id },
      data: {
        avatarUrl: versionedAvatarUrl,
        avatarUploadedAt,
      } as any,
    });

    if (profile?.avatarUrl) {
      const oldPath = extractStoragePathFromPublicUrl(profile.avatarUrl as unknown as string);
      if (oldPath && oldPath !== uploadResult.data.path) {
        await supabase.storage.from(USER_AVATAR_BUCKET).remove([oldPath]);
      }
    }

    await writeAuditLog({
      actorUserId: user.id,
      action: "avatar_uploaded" as any,
      entityType: "profile",
      entityId: user.id,
      metadata: {
        avatarUrl: versionedAvatarUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl: versionedAvatarUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật ảnh đại diện." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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
      select: { avatarUrl: true } as any,
    });

    if (!profile?.avatarUrl) {
      return NextResponse.json({ success: true, data: { avatarUrl: null } });
    }

    const oldPath = extractStoragePathFromPublicUrl(profile.avatarUrl as unknown as string);
    if (oldPath) {
      await supabase.storage.from(USER_AVATAR_BUCKET).remove([oldPath]);
    }

    await prisma.profile.update({
      where: { id: user.id },
      data: {
        avatarUrl: null,
        avatarUploadedAt: null,
      } as any,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "avatar_deleted" as any,
      entityType: "profile",
      entityId: user.id,
      metadata: {
        avatarUrl: profile.avatarUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl: null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể xóa ảnh đại diện." },
      { status: 500 }
    );
  }
}