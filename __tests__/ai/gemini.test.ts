import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

import { generateGeminiReply } from "@/lib/ai/gemini";

beforeEach(() => {
  fetchMock.mockReset();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_BASE_URL;
});

describe("generateGeminiReply", () => {
  it("returns a safe error when the API key is missing", async () => {
    const result = await generateGeminiReply({
      systemInstruction: "test",
      contents: [{ role: "user", parts: [{ text: "Xin chào" }] }],
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.code).toBe("ERR_AI_NOT_CONFIGURED");
    }
  });

  it("returns a safe error when the provider request fails", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    fetchMock.mockResolvedValue({ ok: false, json: vi.fn() });

    const result = await generateGeminiReply({
      systemInstruction: "test",
      contents: [{ role: "user", parts: [{ text: "Xin chào" }] }],
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.code).toBe("ERR_AI_PROVIDER");
    }
  });

  it("extracts assistant text from a valid Gemini response", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "Xin chào, tôi có thể giúp bạn." }],
            },
          },
        ],
      })),
    });

    const result = await generateGeminiReply({
      systemInstruction: "test",
      contents: [{ role: "user", parts: [{ text: "Xin chào" }] }],
    });

    expect("text" in result).toBe(true);
    if ("text" in result) {
      expect(result.text).toContain("Xin chào");
    }
  });
});