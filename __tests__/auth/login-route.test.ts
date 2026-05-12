import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => []),
    get: vi.fn(),
    set: vi.fn(),
  };

  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    prisma: {
      profile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      loginAttempt: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      userSession: {
        create: vi.fn(),
      },
      trustedDevice: {
        upsert: vi.fn(),
      },
    },
    writeAuditLog: vi.fn(),
    createNotification: vi.fn(),
    generateSessionToken: vi.fn(() => "session-token"),
    hashToken: vi.fn((token: string) => `hash:${token}`),
    getSessionExpiresAt: vi.fn(() => new Date("2026-06-01T01:00:00.000Z")),
    getTrustedDeviceExpiresAt: vi.fn(() => new Date("2026-07-01T00:00:00.000Z")),
    buildTrustedDeviceFingerprint: vi.fn(() => "trusted-device-fingerprint"),
    getLockoutUntilFromAttempts: vi.fn(() => null),
    isLoginLockActive: vi.fn(() => false),
  };
});

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mocks.getUser,
      signInWithPassword: mocks.signInWithPassword,
    },
  })),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/audit-logger", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: mocks.createNotification,
}));

vi.mock("@/lib/session", () => ({
  APP_SESSION_COOKIE_NAME: "wk_app_session",
  LOGIN_LOCKOUT_FAILURE_LIMIT: 3,
  TRUSTED_DEVICE_COOKIE_NAME: "wk_trusted_device",
  generateSessionToken: mocks.generateSessionToken,
  getSessionExpiresAt: mocks.getSessionExpiresAt,
  getTrustedDeviceExpiresAt: mocks.getTrustedDeviceExpiresAt,
  hashToken: mocks.hashToken,
  buildTrustedDeviceFingerprint: mocks.buildTrustedDeviceFingerprint,
}));

vi.mock("@/lib/session/abuse", () => ({
  getLockoutUntilFromAttempts: mocks.getLockoutUntilFromAttempts,
  isLoginLockActive: mocks.isLoginLockActive,
}));

import { POST } from "@/app/api/auth/login/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.cookieStore.get.mockReset();
  mocks.cookieStore.set.mockReset();
  mocks.signInWithPassword.mockReset();
  mocks.getUser.mockReset();
  mocks.prisma.profile.findUnique.mockReset();
  mocks.prisma.profile.update.mockReset();
  mocks.prisma.loginAttempt.findMany.mockReset();
  mocks.prisma.loginAttempt.create.mockReset();
  mocks.prisma.userSession.create.mockReset();
  mocks.prisma.trustedDevice.upsert.mockReset();
  mocks.writeAuditLog.mockReset();
  mocks.createNotification.mockReset();
  mocks.generateSessionToken.mockReturnValue("session-token");
  mocks.hashToken.mockImplementation((token: string) => `hash:${token}`);
  mocks.getSessionExpiresAt.mockReturnValue(new Date("2026-06-01T01:00:00.000Z"));
  mocks.getTrustedDeviceExpiresAt.mockReturnValue(new Date("2026-07-01T00:00:00.000Z"));
  mocks.buildTrustedDeviceFingerprint.mockReturnValue("trusted-device-fingerprint");
  mocks.getLockoutUntilFromAttempts.mockReturnValue(null);
  mocks.isLoginLockActive.mockReturnValue(false);
});

describe("POST /api/auth/login", () => {
  it("redirects to the dashboard after a successful sign-in", async () => {
    mocks.prisma.profile.findUnique.mockResolvedValue({
      id: "profile-1",
      status: "active",
      lockedUntil: null,
    });
    mocks.prisma.loginAttempt.findMany.mockResolvedValue([]);
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: "token" },
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "employee@workkpi.com",
        password: "Password123!",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    expect(mocks.prisma.userSession.create).toHaveBeenCalledTimes(1);
  });

  it("returns the shared auth error envelope for invalid credentials", async () => {
    mocks.prisma.profile.findUnique.mockResolvedValue(null);
    mocks.prisma.loginAttempt.findMany.mockResolvedValue([]);
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        session: null,
        user: null,
      },
      error: { message: "Invalid login" },
    });

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "employee@workkpi.com",
        password: "wrong-password",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: "Tài khoản hoặc mật khẩu không chính xác.",
    });
  });

  it("stores a trusted device when the user opts in", async () => {
    mocks.prisma.profile.findUnique.mockResolvedValue({
      id: "profile-1",
      status: "active",
      lockedUntil: null,
    });
    mocks.prisma.loginAttempt.findMany.mockResolvedValue([]);
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: "token" },
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.trustedDevice.upsert.mockResolvedValue({
      id: "trusted-device-1",
    });

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-device-name": "MacBook Pro",
        "user-agent": "Vitest Browser",
      },
      body: JSON.stringify({
        email: "employee@workkpi.com",
        password: "Password123!",
        rememberDevice: true,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(mocks.prisma.trustedDevice.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "security.device_trusted",
      })
    );
    expect(response.headers.get("set-cookie")).toContain("wk_trusted_device");
  });
});