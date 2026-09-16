import { mobileApiRequest } from "@/src/api/client";
import type { ConversationDetailResponse, ConversationsResponse, SendMessageResult } from "@/src/domains/messages/types";

export type QuickMaterialRequestType =
  | "portfolio"
  | "intro_video"
  | "measurements"
  | "availability";

export function getConversations() {
  return mobileApiRequest<ConversationsResponse>("/api/conversations");
}

export function getConversationDetail(conversationId: number) {
  return mobileApiRequest<ConversationDetailResponse>(`/api/conversations/${conversationId}`);
}

export function markConversationRead(conversationId: number) {
  return mobileApiRequest<{ ok: true; count: number }>(`/api/conversations/${conversationId}`, {
    method: "PATCH",
  });
}

export function sendConversationMessage(conversationId: number, body: string) {
  return mobileApiRequest<SendMessageResult>(`/api/conversations/${conversationId}`, {
    method: "POST",
    body: { body },
  });
}

export function submitQuickTalentDecision(conversationId: number, decision: "accept" | "decline", locale: "ar" | "en") {
  return mobileApiRequest<{ ok: true; state: "mutually_confirmed" | "declined" }>(`/api/conversations/${conversationId}/quick/talent-decision`, {
    method: "POST",
    body: { decision, locale },
  });
}

export function requestQuickMaterials(
  conversationId: number,
  requestType: QuickMaterialRequestType,
  locale: "ar" | "en",
) {
  return mobileApiRequest<{ ok: true; code: "CREATED" | "ALREADY_EXISTS" }>(`/api/conversations/${conversationId}/quick/materials`, {
    method: "POST",
    body: { requestType, locale },
  });
}

export function confirmQuickSelection(conversationId: number, locale: "ar" | "en") {
  return mobileApiRequest<{ ok: true; code: "CREATED" | "ALREADY_EXISTS" }>(`/api/conversations/${conversationId}/quick/confirm-selection`, {
    method: "POST",
    body: { locale },
  });
}

export function shareQuickContact(conversationId: number, locale: "ar" | "en") {
  return mobileApiRequest<{ ok: true; code: "SHARED" | "ALREADY_SHARED" }>(`/api/conversations/${conversationId}/quick/share-contact`, {
    method: "POST",
    body: { locale },
  });
}
