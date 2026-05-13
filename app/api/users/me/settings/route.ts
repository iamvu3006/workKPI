import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit-logger";
import { prisma } from "@/lib/db/prisma";
import {
  mapLanguageToLocale,
  updateSettingsSchema,
  profileResponseSelect,
} from "@/lib/profile/validation";
import { createClient } from "@/utils/supabase/server";

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
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ." },
        { status: 400 }
      );
    }

    const { theme, language, locale, timezone, timeZone, defaultTaskFilter, keyboardShortcuts, notificationEmail } = parsed.data;

    const updated = await prisma.profile.update({
      where: { id: user.id },
      data: {
        ...(theme ? { theme } : {}),
        ...(locale || language ? { locale: mapLanguageToLocale(locale ?? language) ?? undefined } : {}),
        ...(timezone || timeZone ? { timeZone: timezone ?? timeZone } : {}),
        ...(defaultTaskFilter !== undefined ? { defaultTaskFilter } : {}),
        ...(keyboardShortcuts !== undefined ? { keyboardShortcuts } : {}),
        ...(notificationEmail !== undefined ? { notificationEmail } : {}),
      } as any,
      select: profileResponseSelect as any,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "settings_updated" as any,
      entityType: "profile",
      entityId: user.id,
      metadata: {
        updatedFields: Object.keys(parsed.data),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        displayName: updated.fullName,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật cài đặt." },
      { status: 500 }
    );
  }
}