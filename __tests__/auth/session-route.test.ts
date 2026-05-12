import { beforeEach, describe, expect, it, vi } from "vitest";

import { APP_SESSION_COOKIE_NAME } from "@/lib/session";

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
    findFirst: vi.fn(),
    hashToken: vi.fn((token: string) => `hash:${token}`),
    isSessionExpired: vi.fn(() => false),
    shouldWarnBeforeExpiry: vi.fn(() => false),
    getSessionWarningAt: vi.fn(() => new Date("2026-05-13T00:30:00.000Z")),
    getSessionExpiresAt: vi.fn(() => new Date("2026-05-13T01:00:00.000Z")),
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
    },
  },
}));

vi.mock("@/lib/session", () => ({
  APP_SESSION_COOKIE_NAME: "wk_app_session",
  hashToken: mocks.hashToken,
  isSessionExpired: mocks.isSessionExpired,
  shouldWarnBeforeExpiry: mocks.shouldWarnBeforeExpiry,
  getSessionWarningAt: mocks.getSessionWarningAt,
  getSessionExpiresAt: mocks.getSessionExpiresAt,
}));

import { GET } from "@/app/api/auth/session/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.cookieStore.get.mockReset();
  mocks.cookieStore.set.mockReset();
  mocks.getUser.mockReset();
  mocks.findFirst.mockReset();
  mocks.hashToken.mockImplementation((token: string) => `hash:${token}`);
  mocks.isSessionExpired.mockReturnValue(false);
  mocks.shouldWarnBeforeExpiry.mockReturnValue(false);
});

describe("GET /api/auth/session", () => {
  it("returns the current active session state", async () => {
    const lastSeenAt = new Date("2026-05-13T00:00:00.000Z");
    const expiresAt = new Date("2026-05-13T01:00:00.000Z");

    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
    });
    mocks.cookieStore.get.mockReturnValue({
      value: "app-session-token",
    });
    mocks.findFirst.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionTokenHash: "hash:app-session-token",
      revokedAt: null,
      lastSeenAt,
      expiresAt,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        session: {
          id: "session-1",
          userId: "user-1",
          sessionTokenHash: "hash:app-session-token",
          revokedAt: null,
          lastSeenAt: "2026-05-13T00:00:00.000Z",
          expiresAt: "2026-05-13T01:00:00.000Z",
        },
        warningAt: "2026-05-13T00:30:00.000Z",
        expiresAt: "2026-05-13T01:00:00.000Z",
        shouldWarn: false,
      },
    });
    expect(mocks.hashToken).toHaveBeenCalledWith("app-session-token");
    expect(mocks.cookieStore.get).toHaveBeenCalledWith(APP_SESSION_COOKIE_NAME);
  });
});