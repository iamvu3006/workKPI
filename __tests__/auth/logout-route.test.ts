import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("clears the authenticated session and returns success", async () => {
    const request = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
    });
    expect(response.headers.get("set-cookie")).toContain("auth");
  });
});