import { NextRequest } from "next/server";

import { getAiActor } from "@/lib/ai/auth";
import { buildAiContext } from "@/lib/ai/context";
import { generateGeminiReply } from "@/lib/ai/gemini";
import { aiChatSchema } from "@/lib/ai/validation";
import { prisma } from "@/lib/db/prisma";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

import type { AiMessageRole } from "@prisma/client";

const GEMINI_MESSAGE_LIMIT = 12;

function toGeminiRole(role: AiMessageRole): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

function serializeConversation(conversation: {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function serializeMessage(message: {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  metadata: unknown;
  createdAt: Date;
}) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt,
  };
}

function buildConversationTitle(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= 48) return normalized;
  return `${normalized.slice(0, 45).trimEnd()}...`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify Prisma AI models are available
    if (
      typeof (prisma as any).aiConversation === "undefined" ||
      typeof (prisma as any).aiMessage === "undefined"
    ) {
      // eslint-disable-next-line no-console
      console.error(
        "[api/ai/chat] ERROR: prisma AI models undefined. " +
          "Prisma client not generated correctly."
      );
      return taskError(
        "Hệ thống chưa sẵn sàng. Vui lòng liên hệ quản trị viên.",
        "ERR_AI_NOT_READY",
        503
      );
    }

    const auth = await getAiActor();
    if ("error" in auth) {
      return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return taskError("Dữ liệu gửi lên không hợp lệ.", "ERR_AI_INVALID_INPUT", 400);
    }

    const parsed = aiChatSchema.safeParse(body);
    if (!parsed.success) {
      return taskError("Dữ liệu gửi lên không hợp lệ.", "ERR_AI_INVALID_INPUT", 400);
    }

    const { message, conversationId } = parsed.data;

    let conversation = conversationId
      ? await prisma.aiConversation.findFirst({
          where: { id: conversationId, userId: auth.actor.id },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        })
      : null;

    if (conversationId && !conversation) {
      return taskError("Không tìm thấy cuộc trò chuyện.", "ERR_AI_CONVERSATION_NOT_FOUND", 404);
    }

    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          userId: auth.actor.id,
          title: buildConversationTitle(message),
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const messagesForGemini = [...conversation.messages, userMessage]
      .filter((entry) => entry.role !== "system")
      .slice(-GEMINI_MESSAGE_LIMIT)
      .map((entry) => ({
        role: toGeminiRole(entry.role),
        parts: [{ text: entry.content }],
      }));

    const aiContext = await buildAiContext(auth.actor);
    const geminiResult = await generateGeminiReply({
      systemInstruction: aiContext.systemInstruction,
      contents: messagesForGemini,
    });

    if ("error" in geminiResult) {
      return taskError(geminiResult.error, geminiResult.code, geminiResult.status);
    }

    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: geminiResult.text,
        metadata: {
          model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
        },
      },
    });

    const touchedConversation = await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        title: conversation.title ?? buildConversationTitle(message),
      },
    });

    return taskSuccess(
      {
        conversation: serializeConversation(touchedConversation),
        messages: [...conversation.messages, userMessage, assistantMessage].map(serializeMessage),
      },
      "Đã nhận phản hồi từ trợ lý AI."
    );
  } catch (error) {
    // Log detailed server-side error for debugging in dev
    // eslint-disable-next-line no-console
    console.error("[api/ai/chat] POST error:", error);
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("  Error message:", error.message);
      if ("code" in error) {
        // eslint-disable-next-line no-console
        console.error("  Error code:", (error as any).code);
      }
    }
    return taskError("Không thể xử lý yêu cầu AI.", "ERR_AI_CHAT", 500);
  }
}