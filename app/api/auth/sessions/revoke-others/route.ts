import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit-logger";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/utils/supabase/server";
import { APP_SESSION_COOKIE_NAME, hashToken } from "@/lib/session";

export async function POST(request: NextRequest) {
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

    // Determine the current session by reading the app session cookie and matching its hash.
    const sessionToken = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value;
    let currentSessionId: string | null = null;

    if (sessionToken) {
      const tokenHash = hashToken(sessionToken);
      const current = await prisma.userSession.findFirst({
        where: { userId: user.id, sessionTokenHash: tokenHash, revokedAt: null },
      });
      if (current) {
        currentSessionId = current.id;
      }
    }

    // Revoke all sessions belonging to the user except the current one (if known).
    const revokeWhere: any = { userId: user.id, revokedAt: null };
    if (currentSessionId) {
      revokeWhere.id = { not: currentSessionId };
    } else {
      // If we couldn't identify current session, only revoke sessions where isCurrent = false
      revokeWhere.isCurrent = false;
    }

    const sessionsToRevoke = await prisma.userSession.findMany({ where: revokeWhere });

    if (sessionsToRevoke.length === 0) {
      return NextResponse.json({ success: true, data: { revoked: 0 } });
    }

    const ids = sessionsToRevoke.map((s) => s.id);

    await prisma.userSession.updateMany({ where: { id: { in: ids } }, data: { revokedAt: new Date(), isCurrent: false } });

    // Ensure the current session row (if identified) is marked as current and not revoked.
    if (currentSessionId) {
      await prisma.userSession.updateMany({ where: { userId: user.id, id: currentSessionId }, data: { isCurrent: true, revokedAt: null } });
    }

    // Audit log and single notification summarizing action
    await writeAuditLog({
      actorUserId: user.id,
      action: "logout",
      entityType: "user_session",
      metadata: { event: "revoke_other_sessions", count: ids.length },
    });

    await createNotification({
      userId: user.id,
      type: "security.session_revoked",
      title: "Đăng xuất các thiết bị khác",
      body: `Đã đăng xuất ${ids.length} thiết bị khác khỏi tài khoản của bạn.`,
      payload: { revokedSessionIds: ids },
    });

    return NextResponse.json({ success: true, data: { revoked: ids.length, revokedIds: ids } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Không thể thu hồi các session." }, { status: 500 });
  }
}
