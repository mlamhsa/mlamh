import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
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

export function respondToQuickTalentDecision(
  conversationId: number,
  decision: "accept" | "decline",
  locale: AppLocale,
) {
  return mobileApiRequest<{ ok: true; decision: "accept" | "decline" }>(
    `/api/conversations/${conversationId}/quick/talent-decision`,
    {
      method: "POST",
      body: { decision, locale },
    },
  );
}
