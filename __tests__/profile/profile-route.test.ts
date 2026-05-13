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
    getUser: vi.fn(),
    prisma: {
      profile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
    writeAuditLog: vi.fn(),
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
  prisma: mocks.prisma,
}));

vi.mock("@/lib/audit-logger", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import { GET, PATCH } from "@/app/api/users/me/profile/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.getUser.mockReset();
  mocks.prisma.profile.findUnique.mockReset();
  mocks.prisma.profile.update.mockReset();
  mocks.writeAuditLog.mockReset();
});

describe("GET /api/users/me/profile", () => {
  it("returns the user's profile when authenticated", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: "+84901234567",
      avatarUrl: "https://storage.example.com/avatars/user-1/image.jpg",
      avatarUploadedAt: new Date("2026-05-01T10:00:00Z"),
      theme: "light",
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/profile");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.email).toBe("user@company.com");
    expect(data.data.displayName).toBe("John Doe");
  });

  it("returns 401 when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const request = new NextRequest("http://localhost/api/users/me/profile");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("đăng nhập");
  });

  it("returns 404 when profile not found", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/users/me/profile");
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

describe("PATCH /api/users/me/profile", () => {
  it("updates user's profile fields when authenticated", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "Jane Doe",
      phone: "+84987654321",
      avatarUrl: "https://storage.example.com/avatars/user-1/image.jpg",
      avatarUploadedAt: new Date("2026-05-01T10:00:00Z"),
      theme: "light",
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Jane Doe",
        phone: "+84987654321",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.displayName).toBe("Jane Doe");
    expect(data.data.phone).toBe("+84987654321");
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "profile_updated",
        entityType: "profile",
      })
    );
  });

  it("returns 400 when no fields are provided", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("returns 401 when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const request = new NextRequest("http://localhost/api/users/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Jane Doe",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("validates phone number format", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phone: "abc",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
