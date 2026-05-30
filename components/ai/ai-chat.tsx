"use client";

import { useEffect, useState } from "react";

import { ConversationList, type AiConversationSummary } from "@/components/ai/conversation-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AiMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: unknown;
  createdAt: string;
};

type ConversationDetail = {
  conversation: {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  };
  messages: AiMessage[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AiChat() {
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchConversation(conversationId: string) {
    setLoadingMessages(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, { cache: "no-store" });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể tải cuộc trò chuyện.");
      }

      const detail = json.data as ConversationDetail;
      setMessages(detail.messages);
      setActiveConversationId(detail.conversation.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể tải nội dung cuộc trò chuyện.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function fetchConversations(nextActiveConversationId?: string | null) {
    setLoadingConversations(true);
    try {
      const response = await fetch("/api/ai/conversations", { cache: "no-store" });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể tải danh sách cuộc trò chuyện.");
      }

      const nextConversations = json.data.conversations as AiConversationSummary[];
      setConversations(nextConversations);

      const selectedConversationId = nextActiveConversationId ?? activeConversationId ?? nextConversations[0]?.id ?? null;
      if (selectedConversationId) {
        setActiveConversationId(selectedConversationId);
        await fetchConversation(selectedConversationId);
      } else {
        setMessages([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể tải lịch sử cuộc trò chuyện.");
    } finally {
      setLoadingConversations(false);
    }
  }

  useEffect(() => {
    void fetchConversations();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();

    if (trimmed.length < 2) {
      setError("Tin nhắn phải có ít nhất 2 ký tự.");
      return;
    }

    const optimisticUserMessage: AiMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId ?? "temp",
      role: "user",
      content: trimmed,
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    setError(null);
    setSending(true);
    setMessage("");
    setMessages((current) => [...current, optimisticUserMessage]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId: activeConversationId ?? undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể gửi tin nhắn.");
      }

      const nextDetail = json.data as ConversationDetail;
      setMessages(nextDetail.messages);
      setActiveConversationId(nextDetail.conversation.id);
      await fetchConversations(nextDetail.conversation.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể nhận phản hồi từ trợ lý AI. Vui lòng thử lại sau.");
      setMessages((current) => current.filter((entry) => entry.id !== optimisticUserMessage.id));
    } finally {
      setSending(false);
    }
  }

  function startNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(conversationId) => void fetchConversation(conversationId)}
        onStartNewConversation={startNewConversation}
        loading={loadingConversations}
      />

      <Card className="min-h-[720px] border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-amber-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">AI Assistant</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Hỏi về task, KPI, tiến độ công việc hoặc yêu cầu tóm tắt theo phạm vi quyền của bạn.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchConversations(activeConversationId)}>
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-[620px] flex-col gap-4 p-5">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-base font-semibold text-slate-900">Bắt đầu một câu hỏi mới</p>
                  <p className="text-sm leading-6 text-slate-500">
                    Ví dụ: “Tóm tắt task của tôi”, “Có việc nào quá hạn không?”, hoặc “KPI phòng ban tháng này thế nào?”.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((entry) => (
                <div key={entry.id} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      entry.role === "user"
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{entry.content}</div>
                    <div className={`mt-2 text-[11px] ${entry.role === "user" ? "text-teal-50/80" : "text-slate-400"}`}>
                      {formatTime(entry.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  AI đang trả lời...
                </div>
              </div>
            )}

            {loadingMessages && (
              <div className="flex justify-center py-2 text-xs text-slate-400">Đang tải cuộc trò chuyện...</div>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Nhập câu hỏi của bạn bằng tiếng Việt..."
              className="min-h-[110px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
              disabled={sending}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Trợ lý chỉ trả lời trong phạm vi quyền và dữ liệu được cấp.
              </p>
              <Button type="submit" disabled={sending || message.trim().length < 2}>
                Gửi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}