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
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
    writeAuditLog: vi.fn(),
    supabaseStorage: {
      upload: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    },
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
    storage: {
      from: vi.fn(() => ({
        upload: mocks.supabaseStorage.upload,
        remove: mocks.supabaseStorage.remove,
        getPublicUrl: mocks.supabaseStorage.getPublicUrl,
      })),
    },
  })),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/audit-logger", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import { POST, DELETE } from "@/app/api/users/me/avatar/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.getUser.mockReset();
  mocks.prisma.profile.findUnique.mockReset();
  mocks.prisma.profile.update.mockReset();
  mocks.writeAuditLog.mockReset();
  mocks.supabaseStorage.upload.mockReset();
  mocks.supabaseStorage.remove.mockReset();
  mocks.supabaseStorage.getPublicUrl.mockReset();
});

describe("POST /api/users/me/avatar", () => {
  it("uploads a new avatar and returns the public URL", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      avatarUrl: null,
    });
    mocks.supabaseStorage.upload.mockResolvedValue({
      data: { path: "user-1/abc123.png" },
      error: null,
    });
    mocks.supabaseStorage.getPublicUrl.mockReturnValue({
      data: {
        publicUrl: "https://storage.example.com/avatars/user-1/abc123.png",
      },
    });
    mocks.prisma.profile.update.mockResolvedValue({
      avatarUrl: "https://storage.example.com/avatars/user-1/abc123.png?v=1234567890",
    });

    const file = new File(["image data"], "avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.avatarUrl).toContain("https://storage.example.com");
    expect(mocks.supabaseStorage.upload).toHaveBeenCalled();
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "avatar_uploaded",
      })
    );
  });

  it("returns 400 when file is not provided", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const formData = new FormData();
    const request = new NextRequest("http://localhost/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("returns 400 when file exceeds size limit (>2MB)", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const largeData = new Uint8Array(2.1 * 1024 * 1024);
    const file = new File([largeData], "large.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("returns 400 for unsupported file types", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const file = new File(["data"], "file.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/users/me/avatar", {
      method: "POST",
      body: formData,
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

    const file = new File(["image data"], "avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("removes old avatar when uploading a new one", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      avatarUrl: "https://storage.example.com/avatars/user-1/old123.png",
    });
    mocks.supabaseStorage.upload.mockResolvedValue({
      data: { path: "user-1/new456.png" },
      error: null,
    });
    mocks.supabaseStorage.getPublicUrl.mockReturnValue({
      data: {
        publicUrl: "https://storage.example.com/avatars/user-1/new456.png",
      },
    });
    mocks.prisma.profile.update.mockResolvedValue({
      avatarUrl: "https://storage.example.com/avatars/user-1/new456.png?v=1234567890",
    });

    const file = new File(["image data"], "avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.supabaseStorage.remove).toHaveBeenCalledWith(
      expect.arrayContaining(["user-1/old123.png"])
    );
  });
});

describe("DELETE /api/users/me/avatar", () => {
  it("deletes user's avatar and returns success", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      avatarUrl: "https://storage.example.com/avatars/user-1/image.png",
    });
    mocks.supabaseStorage.remove.mockResolvedValue({
      data: [{ message: "Successfully deleted" }],
      error: null,
    });
    mocks.prisma.profile.update.mockResolvedValue({
      avatarUrl: null,
    });

    const response = await DELETE();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.avatarUrl).toBe(null);
    expect(mocks.supabaseStorage.remove).toHaveBeenCalled();
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "avatar_deleted",
      })
    );
  });

  it("returns success when avatar is already null", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      avatarUrl: null,
    });

    const response = await DELETE();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("returns 401 when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await DELETE();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
