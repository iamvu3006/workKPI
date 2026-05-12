import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit-logger";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { revokeSessionSchema } from "@/lib/session/validation";
import { createClient } from "@/utils/supabase/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;
    const parsedResult = revokeSessionSchema.safeParse({ sessionId: id });

    if (!parsedResult.success) {
      return NextResponse.json(
        { success: false, error: "Session ID không hợp lệ." },
        { status: 400 }
      );
    }

    const session = await prisma.userSession.findFirst({
      where: {
        id: parsedResult.data.sessionId,
        userId: user.id,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy session." },
        { status: 404 }
      );
    }

    const revokedSession = await prisma.userSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        isCurrent: false,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "logout",
      entityType: "user_session",
      entityId: revokedSession.id,
      metadata: {
        event: "revoke_session",
      },
    });

    await createNotification({
      userId: user.id,
      type: "security.session_revoked",
      title: "Một phiên đăng nhập đã được thu hồi",
      body: "Một phiên đăng nhập trên tài khoản của bạn vừa bị đăng xuất từ xa.",
      payload: {
        sessionId: revokedSession.id,
        deviceName: revokedSession.deviceName,
        revokedAt: revokedSession.revokedAt?.toISOString() ?? new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        session: revokedSession,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể thu hồi session." },
      { status: 500 }
    );
  }
}