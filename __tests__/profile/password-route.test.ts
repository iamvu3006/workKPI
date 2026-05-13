import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => []),
  };

  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
    prisma: {
      profile: {
        findUnique: vi.fn(),
      },
    },
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
      signInWithPassword: mocks.signInWithPassword,
      updateUser: mocks.updateUser,
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

import { POST } from "@/app/api/users/me/password/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.getUser.mockReset();
  mocks.signInWithPassword.mockReset();
  mocks.updateUser.mockReset();
  mocks.prisma.profile.findUnique.mockReset();
  mocks.writeAuditLog.mockReset();
  mocks.createNotification.mockReset();
});

describe("POST /api/users/me/password", () => {
  it("changes password when current password is correct and new password is strong", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      email: "user@company.com",
    });
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!@",
        confirmPassword: "NewPassword123!@",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.passwordChanged).toBe(true);
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "NewPassword123!@",
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "password_changed",
      })
    );
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "security.password_changed",
      })
    );
  });

  it("returns 400 when passwords do not match", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!@",
        confirmPassword: "DifferentPassword123!@",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("returns 401 when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const request = new NextRequest("http://localhost/api/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!@",
        confirmPassword: "NewPassword123!@",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("returns 400 when current password is incorrect", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      email: "user@company.com",
    });
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: null,
      },
      error: new Error("Invalid credentials"),
    });

    const request = new NextRequest("http://localhost/api/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "WrongPassword123!",
        newPassword: "NewPassword123!@",
        confirmPassword: "NewPassword123!@",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
