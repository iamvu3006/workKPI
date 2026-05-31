import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAiActor: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/ai/auth", () => ({
  getAiActor: mocks.getAiActor,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    aiConversation: {
      findFirst: mocks.findFirst,
    },
  },
}));

import { GET } from "@/app/api/ai/conversations/[id]/route";

beforeEach(() => {
  mocks.getAiActor.mockReset();
  mocks.findFirst.mockReset();
});

describe("GET /api/ai/conversations/[id]", () => {
  it("returns 404 when the conversation belongs to another user", async () => {
    mocks.getAiActor.mockResolvedValue({
      actor: {
        id: "user-1",
        role: "EMPLOYEE",
        departmentId: null,
        teamId: null,
        fullName: "User 1",
        displayName: "User 1",
        email: "user1@workkpi.com",
        department: null,
        team: null,
      },
    });
    mocks.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/ai/conversations/conv-1"), {
      params: Promise.resolve({ id: "conv-1" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        success: false,
        code: "ERR_AI_CONVERSATION_NOT_FOUND",
      })
    );
  });
});