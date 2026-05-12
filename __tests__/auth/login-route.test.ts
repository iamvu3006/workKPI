import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  it("redirects to the dashboard after a successful sign-in", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "employee@workkpi.com",
        password: "Password123!",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/dashboard");
  });

  it("returns the shared auth error envelope for invalid credentials", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "employee@workkpi.com",
        password: "wrong-password",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: "Tài khoản hoặc mật khẩu không chính xác.",
    });
  });
});