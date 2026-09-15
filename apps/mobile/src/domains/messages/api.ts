import { mobileApiRequest } from "@/src/api/client";
import type { ConversationDetailResponse, SendMessageResult } from "@/src/domains/messages/types";

export function getConversationDetail(conversationId: number) {
  return mobileApiRequest<ConversationDetailResponse>(`/api/conversations/${conversationId}`);
}

export function sendConversationMessage(conversationId: number, body: string) {
  return mobileApiRequest<SendMessageResult>(`/api/conversations/${conversationId}`, {
    method: "POST",
    body: { body },
  });
}
