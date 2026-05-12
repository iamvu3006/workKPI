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
    signOut: vi.fn(),
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
      signOut: mocks.signOut,
    },
  })),
}));

vi.mock("@/lib/audit-logger", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import { POST } from "@/app/api/auth/logout/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.cookieStore.set.mockReset();
  mocks.getUser.mockReset();
  mocks.signOut.mockReset();
  mocks.writeAuditLog.mockReset();
});

describe("POST /api/auth/logout", () => {
  it("clears the authenticated session and returns success", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "employee@workkpi.com",
        },
      },
    });
    mocks.signOut.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
    });
    expect(response.headers.get("set-cookie")).toContain("sb-auth-token");
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        action: "logout",
      })
    );
  });
});