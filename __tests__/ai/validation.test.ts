import { describe, expect, it } from "vitest";

import { aiChatSchema } from "@/lib/ai/validation";

describe("ai chat validation", () => {
  it("rejects short messages", () => {
    const result = aiChatSchema.safeParse({
      message: " ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid message", () => {
    const result = aiChatSchema.safeParse({
      message: "Tóm tắt task của tôi",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid conversation ids", () => {
    const result = aiChatSchema.safeParse({
      message: "Tóm tắt task của tôi",
      conversationId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });
});