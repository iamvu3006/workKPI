import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().trim().min(2, "Tin nhắn phải có ít nhất 2 ký tự.").max(2000, "Tin nhắn quá dài."),
  conversationId: z.string().uuid().optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;