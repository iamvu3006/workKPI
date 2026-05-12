import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, loginSchema, updatePasswordSchema } from "@/lib/auth/validation";

describe("auth validation", () => {
  it("blocks invalid sign-in emails", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password123!",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid sign-in payload", () => {
    const result = loginSchema.safeParse({
      email: "employee@workkpi.com",
      password: "Password123!",
    });

    expect(result.success).toBe(true);
  });

  it("requires password reset requests to use a valid email address", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "bad-email",
    });

    expect(result.success).toBe(false);
  });

  it("requires matching confirmation before accepting a password update", () => {
    const result = updatePasswordSchema.safeParse({
      password: "Password123!",
      confirmPassword: "Password1234!",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/match/i);
    }
  });
});