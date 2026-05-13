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
    prisma: {
      profile: {
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

import { PATCH } from "@/app/api/users/me/settings/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.getUser.mockReset();
  mocks.prisma.profile.update.mockReset();
  mocks.writeAuditLog.mockReset();
});

describe("PATCH /api/users/me/settings", () => {
  it("updates theme setting", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "dark",
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        theme: "dark",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.theme).toBe("dark");
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "settings_updated",
      })
    );
  });

  it("updates language and maps it to locale", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "light",
      locale: "en-US",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        language: "en",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(mocks.prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          locale: "en-US",
        }),
      })
    );
  });

  it("updates timezone setting", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "light",
      locale: "vi-VN",
      timeZone: "America/New_York",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        timezone: "America/New_York",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.timeZone).toBe("America/New_York");
  });

  it("updates notification email preference", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "light",
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: false,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        notificationEmail: false,
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.notificationEmail).toBe(false);
  });

  it("updates default task filter", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    const filterConfig = JSON.stringify({ status: "in_progress", priority: "high" });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "light",
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: null,
      defaultTaskFilter: filterConfig,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        defaultTaskFilter: filterConfig,
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.defaultTaskFilter).toBe(filterConfig);
  });

  it("updates keyboard shortcuts setting", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    const shortcuts = JSON.stringify({ save: "Ctrl+S", undo: "Ctrl+Z" });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "light",
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: true,
      keyboardShortcuts: shortcuts,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        keyboardShortcuts: shortcuts,
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.keyboardShortcuts).toBe(shortcuts);
  });

  it("updates multiple settings at once", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      id: "user-1",
      email: "user@company.com",
      fullName: "John Doe",
      phone: null,
      avatarUrl: null,
      avatarUploadedAt: null,
      theme: "dark",
      locale: "en-US",
      timeZone: "America/New_York",
      lastLoginAt: new Date("2026-05-13T09:00:00Z"),
      notificationEmail: false,
      keyboardShortcuts: null,
      defaultTaskFilter: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        theme: "dark",
        language: "en",
        timezone: "America/New_York",
        notificationEmail: false,
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.theme).toBe("dark");
    expect(data.data.locale).toBe("en-US");
    expect(data.data.timeZone).toBe("America/New_York");
    expect(data.data.notificationEmail).toBe(false);
  });

  it("returns 400 when no fields are provided", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("returns 400 when invalid theme value is provided", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        theme: "invalid",
      }),
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

    const request = new NextRequest("http://localhost/api/users/me/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        theme: "dark",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
