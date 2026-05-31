import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => []),
    set: vi.fn(),
  };

  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    getUser: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    writeAuditLog: vi.fn(),
    createNotification: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    userSession: {
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/audit-logger", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: mocks.createNotification,
}));

import { POST } from "@/app/api/auth/sessions/[id]/revoke/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.cookieStore.set.mockReset();
  mocks.getUser.mockReset();
  mocks.findFirst.mockReset();
  mocks.update.mockReset();
  mocks.writeAuditLog.mockReset();
  mocks.createNotification.mockReset();
});

describe("POST /api/auth/sessions/:id/revoke", () => {
  it("revokes a session for the authenticated user", async () => {
    const revokedAt = new Date("2026-05-13T01:00:00.000Z");

    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
      error: null,
    });
    mocks.findFirst.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      deviceName: "MacBook Pro",
      revokedAt: null,
    });
    mocks.update.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      deviceName: "MacBook Pro",
      revokedAt,
      isCurrent: false,
    });

    const request = new NextRequest("http://localhost/api/auth/sessions/550e8400-e29b-41d4-a716-446655440000/revoke", {
      method: "POST",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        revokedSessionId: "550e8400-e29b-41d4-a716-446655440000",
        revokedAt: "2026-05-13T01:00:00.000Z",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "logout",
      })
    );
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "security.session_revoked",
      })
    );
  });
});