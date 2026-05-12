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
    findMany: vi.fn(),
    count: vi.fn(),
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
      findMany: mocks.findMany,
      count: mocks.count,
    },
  },
}));

import { GET } from "@/app/api/auth/sessions/route";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.cookieStore.set.mockReset();
  mocks.getUser.mockReset();
  mocks.findMany.mockReset();
  mocks.count.mockReset();
});

describe("GET /api/auth/sessions", () => {
  it("returns the signed-in user's sessions with pagination metadata", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
      error: null,
    });
    mocks.findMany.mockResolvedValue([
      {
        id: "session-1",
        lastSeenAt: new Date("2026-05-13T00:00:00.000Z"),
      },
    ]);
    mocks.count.mockResolvedValue(1);

    const request = new NextRequest("http://localhost/api/auth/sessions?page=1&limit=10");

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        sessions: [
          {
            id: "session-1",
            lastSeenAt: "2026-05-13T00:00:00.000Z",
          },
        ],
      },
      meta: {
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    });
  });
});