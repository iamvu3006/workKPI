import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_ERRORS } from "@/lib/auth/errors";
import { loginSchema } from "@/lib/auth/validation";
import { writeAuditLog } from "@/lib/audit-logger";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import {
  APP_SESSION_COOKIE_NAME,
  LOGIN_LOCKOUT_FAILURE_LIMIT,
  TRUSTED_DEVICE_COOKIE_NAME,
  buildTrustedDeviceFingerprint,
  generateSessionToken,
  getSessionExpiresAt,
  getTrustedDeviceExpiresAt,
  hashToken,
} from "@/lib/session";
import {
  getLockoutUntilFromAttempts,
  isLoginLockActive,
} from "@/lib/session/abuse";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: AUTH_ERRORS.VALIDATION_ERROR.message,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberDevice } = validationResult.data;
    const trustedDeviceToken = rememberDevice ? generateSessionToken() : null;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await prisma.profile.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        lockedUntil: true,
      },
    });

    const recentAttempts = await prisma.loginAttempt.findMany({
      where: { email },
      orderBy: { attemptedAt: "desc" },
      take: LOGIN_LOCKOUT_FAILURE_LIMIT,
      select: {
        success: true,
        attemptedAt: true,
      },
    });

    const isManuallyLocked = profile?.status === "locked" && profile.lockedUntil === null;
    const isTemporarilyLocked = isLoginLockActive(recentAttempts, profile?.lockedUntil ?? null);

    if (isManuallyLocked || isTemporarilyLocked) {
      await prisma.loginAttempt.create({
        data: {
          email,
          userId: profile?.id ?? null,
          success: false,
          failureReason: "locked",
        },
      });

      await writeAuditLog({
        actorUserId: profile?.id ?? null,
        action: "login",
        entityType: "login_attempt",
        metadata: {
          email,
          success: false,
          reason: "locked",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.",
        },
        { status: 423 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      await prisma.loginAttempt.create({
        data: {
          email,
          userId: profile?.id ?? null,
          success: false,
          failureReason: error?.message || "Unknown error",
        },
      });

      const latestAttempts = await prisma.loginAttempt.findMany({
        where: { email },
        orderBy: { attemptedAt: "desc" },
        take: LOGIN_LOCKOUT_FAILURE_LIMIT,
        select: {
          success: true,
          attemptedAt: true,
        },
      });

      const lockoutUntil = getLockoutUntilFromAttempts(latestAttempts);

      if (profile && lockoutUntil) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            status: "locked",
            lockedUntil: lockoutUntil,
          },
        });

        await writeAuditLog({
          actorUserId: profile.id,
          action: "lock_account",
          entityType: "profile",
          entityId: profile.id,
          metadata: {
            email,
            lockedUntil: lockoutUntil.toISOString(),
            failureLimit: LOGIN_LOCKOUT_FAILURE_LIMIT,
          },
        });

        await createNotification({
          userId: profile.id,
          type: "security.alert",
          title: "Tài khoản đã bị khóa tạm thời",
          body: `Tài khoản của bạn đã bị khóa trong ${LOGIN_LOCKOUT_FAILURE_LIMIT} lần đăng nhập thất bại.`,
          payload: {
            email,
            lockedUntil: lockoutUntil.toISOString(),
          },
        });
      }

      await writeAuditLog({
        actorUserId: profile?.id ?? null,
        action: "login",
        entityType: "login_attempt",
        metadata: {
          email,
          success: false,
          reason: error?.message || "Unknown error",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: AUTH_ERRORS.INVALID_CREDENTIALS.message,
        },
        { status: 401 }
      );
    }

    await prisma.loginAttempt.create({
      data: {
        email,
        userId: data.user.id,
        success: true,
        failureReason: null,
      },
    });

    const profileLockedUntil = profile ? (profile.lockedUntil as Date | null) : null;

    if (profile && profileLockedUntil && profileLockedUntil.getTime() <= Date.now()) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          status: "active",
          lockedUntil: null,
        },
      });

      await writeAuditLog({
        actorUserId: profile.id,
        action: "unlock_account",
        entityType: "profile",
        entityId: profile.id,
        metadata: {
          email,
        },
      });
    }

    await writeAuditLog({
      actorUserId: data.user.id,
      action: "login",
      entityType: "user_auth",
      metadata: {
        email,
        success: true,
      },
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });

    const appSessionToken = generateSessionToken();
    const sessionIssuedAt = new Date();
    const sessionExpiresAt = getSessionExpiresAt(sessionIssuedAt);

    await prisma.userSession.create({
      data: {
        userId: data.user.id,
        sessionTokenHash: hashToken(appSessionToken),
        deviceName: request.headers.get("x-device-name"),
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
        isCurrent: true,
        lastSeenAt: sessionIssuedAt,
        expiresAt: sessionExpiresAt,
      },
    });

    await writeAuditLog({
      actorUserId: data.user.id,
      action: "login",
      entityType: "user_session",
      metadata: {
        email,
        expiresAt: sessionExpiresAt.toISOString(),
      },
    });

    response.cookies.set(APP_SESSION_COOKIE_NAME, appSessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: sessionExpiresAt,
    });

    if (rememberDevice && trustedDeviceToken) {
      const trustedDeviceFingerprint = buildTrustedDeviceFingerprint({
        deviceName: request.headers.get("x-device-name"),
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      });
      const trustedUntil = getTrustedDeviceExpiresAt();

      await prisma.trustedDevice.upsert({
        where: {
          userId_deviceFingerprint: {
            userId: data.user.id,
            deviceFingerprint: trustedDeviceFingerprint,
          },
        },
        create: {
          userId: data.user.id,
          deviceFingerprint: trustedDeviceFingerprint,
          deviceName: request.headers.get("x-device-name"),
          ipAddress:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip"),
          userAgent: request.headers.get("user-agent"),
          trustedUntil,
          lastSeenAt: new Date(),
        },
        update: {
          deviceName: request.headers.get("x-device-name"),
          ipAddress:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip"),
          userAgent: request.headers.get("user-agent"),
          trustedUntil,
          lastSeenAt: new Date(),
        },
      });

      await writeAuditLog({
        actorUserId: data.user.id,
        action: "login",
        entityType: "trusted_device",
        entityId: data.user.id,
        metadata: {
          email,
          trustedUntil: trustedUntil.toISOString(),
          fingerprint: trustedDeviceFingerprint,
          tokenHash: hashToken(trustedDeviceToken),
        },
      });

      await createNotification({
        userId: data.user.id,
        type: "security.device_trusted",
        title: "Thiết bị này đã được tin cậy",
        body: "Bạn đã chọn ghi nhớ thiết bị này cho các lần đăng nhập sau.",
        payload: {
          email,
          trustedUntil: trustedUntil.toISOString(),
          fingerprint: trustedDeviceFingerprint,
        },
      });

      response.cookies.set(TRUSTED_DEVICE_COOKIE_NAME, trustedDeviceToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: trustedUntil,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: AUTH_ERRORS.VALIDATION_ERROR.message,
      },
      { status: 400 }
    );
  }
}
