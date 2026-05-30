import { NextRequest } from "next/server";

import { getAiActor } from "@/lib/ai/auth";
import { prisma } from "@/lib/db/prisma";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

import type { AiMessageRole } from "@prisma/client";

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAiActor();
    if ("error" in auth) {
      return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);
    }

    const { id } = await params;

    const conversation = await prisma.aiConversation.findFirst({
      where: { id, userId: auth.actor.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            conversationId: true,
            role: true,
            content: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return taskError("Không tìm thấy cuộc trò chuyện.", "ERR_AI_CONVERSATION_NOT_FOUND", 404);
    }

    return taskSuccess({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: conversation.messages.map(serializeMessage),
    });
  } catch {
    return taskError("Không thể tải cuộc trò chuyện.", "ERR_AI_CONVERSATION_DETAIL", 500);
  }
}