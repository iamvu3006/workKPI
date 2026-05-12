import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/utils/supabase/middleware", () => ({
  createClient: vi.fn(async () => NextResponse.next()),
}));

import { middleware } from "@/middleware";

describe("middleware", () => {
  it("redirects unauthenticated dashboard requests to the login page", async () => {
    const request = new NextRequest("http://localhost/dashboard");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBe("http://localhost/auth/login");
  });
});