import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE_NAME, getSessionExpiresAt, getSessionWarningAt, hashToken, isSessionExpired, shouldWarnBeforeExpiry } from "@/lib/session";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    const sessionToken = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Phiên đăng nhập không hợp lệ." },
        { status: 401 }
      );
    }

    const currentSession = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionTokenHash: hashToken(sessionToken),
        revokedAt: null,
      },
    });

    if (!currentSession || isSessionExpired(currentSession.lastSeenAt) || currentSession.expiresAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: "Phiên đăng nhập đã hết hạn." },
        { status: 401 }
      );
    }

    const warningAt = getSessionWarningAt(currentSession.lastSeenAt);
    const expiresAt = getSessionExpiresAt(currentSession.lastSeenAt);

    return NextResponse.json({
      success: true,
      data: {
        session: currentSession,
        warningAt,
        expiresAt,
        shouldWarn: shouldWarnBeforeExpiry(currentSession.lastSeenAt),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể tải trạng thái session." },
      { status: 500 }
    );
  }
}
