import { getAiActor } from "@/lib/ai/auth";
import { prisma } from "@/lib/db/prisma";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";

export async function GET() {
  try {
    // Verify Prisma AI models are available
    if (typeof (prisma as any).aiConversation === "undefined") {
      // eslint-disable-next-line no-console
      console.error(
        "[api/ai/conversations] ERROR: prisma.aiConversation is undefined. " +
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

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: auth.actor.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return taskSuccess({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation._count.messages,
      })),
    });
  } catch (error) {
    // Log detailed server-side error for debugging in dev
    // eslint-disable-next-line no-console
    console.error("[api/ai/conversations] GET error:", error);
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("  Error message:", error.message);
      if ("code" in error) {
        // eslint-disable-next-line no-console
        console.error("  Error code:", (error as any).code);
      }
    }
    return taskError("Không thể tải danh sách cuộc trò chuyện.", "ERR_AI_CONVERSATIONS", 500);
  }
}