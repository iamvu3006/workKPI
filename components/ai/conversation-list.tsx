"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type AiConversationSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ConversationListProps = {
  conversations: AiConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
  loading?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onStartNewConversation,
  loading,
}: ConversationListProps) {
  return (
    <Card className="h-full border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Cuộc trò chuyện</h2>
          <p className="text-xs text-slate-500">Lịch sử AI Assistant của bạn</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onStartNewConversation}>
          Mới
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {loading && conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
            Đang tải danh sách...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
            Chưa có cuộc trò chuyện nào.
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-all ${
                  isActive
                    ? "border-teal-200 bg-teal-50/70 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {conversation.title || "Cuộc trò chuyện mới"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {conversation.messageCount} tin nhắn · {formatDate(conversation.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}