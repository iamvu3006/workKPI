type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

type GeminiRequest = {
  systemInstruction: string;
  contents: GeminiContent[];
};

type GeminiSuccess = { text: string };
type GeminiFailure = { error: string; code: string; status: number };

function getBaseUrl() {
  return (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

function extractText(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== "object") return null;

  const candidates = (responseData as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  const text = candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || null;
  return text && text.length > 0 ? text : null;
}

export async function generateGeminiReply({ systemInstruction, contents }: GeminiRequest): Promise<GeminiSuccess | GeminiFailure> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error: "Trợ lý AI chưa được cấu hình trên máy chủ.",
      code: "ERR_AI_NOT_CONFIGURED",
      status: 503,
    };
  }

  try {
    const url = `${getBaseUrl()}/models/${encodeURIComponent(getModel())}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      let errBody: unknown;
      try { errBody = await response.json(); } catch { errBody = null; }
      // eslint-disable-next-line no-console
      console.error(
        `[gemini] API error ${response.status} for model ${getModel()}:`,
        JSON.stringify(errBody)
      );
      return {
        error: "Không thể kết nối tới dịch vụ AI.",
        code: "ERR_AI_PROVIDER",
        status: 502,
      };
    }

    const data: unknown = await response.json();
    const text = extractText(data);

    if (!text) {
      return {
        error: "AI không trả về nội dung hợp lệ.",
        code: "ERR_AI_EMPTY_RESPONSE",
        status: 502,
      };
    }

    return { text };
  } catch {
    return {
      error: "Không thể xử lý yêu cầu AI vào lúc này.",
      code: "ERR_AI_REQUEST_FAILED",
      status: 502,
    };
  }
}

export type { GeminiContent };