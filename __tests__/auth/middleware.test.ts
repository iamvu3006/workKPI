import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => []),
    set: vi.fn(),
  };

  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    middlewareClient: vi.fn(() => NextResponse.next()),
    getUser: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/utils/supabase/middleware", () => ({
  createClient: mocks.middlewareClient,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

import { middleware } from "@/middleware";

beforeEach(() => {
  mocks.cookieStore.getAll.mockReset();
  mocks.cookieStore.set.mockReset();
  mocks.middlewareClient.mockReset();
  mocks.getUser.mockReset();
  mocks.middlewareClient.mockResolvedValue(NextResponse.next());
});

describe("middleware", () => {
  it("redirects unauthenticated dashboard requests to the login page", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: null,
      },
    });

    const request = new NextRequest("http://localhost/dashboard");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBe("http://localhost/auth/login");
  });

  it("lets public requests through without checking auth", async () => {
    const request = new NextRequest("http://localhost/");

    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});